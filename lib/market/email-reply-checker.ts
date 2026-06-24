import { dbAdapter } from "./db-adapter"
import { requireAuth } from "@/lib/api-utils"

const imaps = require("imap-simple")

interface EmailReplyResult {
  success: boolean
  found: number
  processed: number
  errors: string[]
}

async function checkEmailReplies(request?: Request): Promise<EmailReplyResult> {
  console.log("[Email Reply Checker] Starting email reply check...")
  
  const result: EmailReplyResult = {
    success: false,
    found: 0,
    processed: 0,
    errors: []
  }
  
  // 如果提供了request，获取当前用户的ID
  let currentUserId: string | null = null
  if (request) {
    try {
      currentUserId = requireAuth(request as any)
      console.log(`[Email Reply Checker] Checking replies for user: ${currentUserId}`)
    } catch (error) {
      console.log("[Email Reply Checker] No auth, checking all replies")
    }
  }
  
  try {
    const provider = process.env.EMAIL_PROVIDER || "smtp"
    let imapHost: string, imapPort: number, imapUser: string, imapPass: string
    
    if (provider === "qq") {
      imapHost = "imap.qq.com"
      imapPort = 993
      imapUser = process.env.AUTH_EMAIL_USER_QQ || ""
      imapPass = process.env.AUTH_EMAIL_PASSWORD_QQ || ""
    } else {
      imapHost = "imap.exmail.qq.com"
      imapPort = 993
      imapUser = process.env.AUTH_EMAIL_USER || process.env.AUTH_EMAIL_SMTP_USER || ""
      imapPass = process.env.AUTH_EMAIL_PASSWORD || process.env.AUTH_EMAIL_SMTP_PASS || ""
    }

    if (!imapUser || !imapPass) {
      result.errors.push("IMAP credentials not configured")
      return result
    }

    const config = {
      imap: {
        user: imapUser,
        password: imapPass,
        host: imapHost,
        port: imapPort,
        tls: true,
        authTimeout: 10000
      }
    }

    console.log(`[Email Reply Checker] Connecting to ${imapHost}:${imapPort}...`)
    
    const connection = await imaps.connect(config)
    console.log("[Email Reply Checker] Connected successfully")
    
    // 主要检查 INBOX 获取回复，垃圾邮件也可能包含回复
    const foldersToCheck = ["INBOX", "Junk", "Spam", "垃圾邮件"]
    const allMessages = []
    
    // 先列出所有可用的文件夹
    try {
      const availableBoxes = await connection.getBoxes()
      console.log(`[Email Reply Checker] Available folders:`, Object.keys(availableBoxes))
    } catch (error) {
      console.log(`[Email Reply Checker] Cannot list folders: ${error}`)
    }
    
    for (const folderName of foldersToCheck) {
      try {
        await connection.openBox(folderName)
        console.log(`[Email Reply Checker] Opened ${folderName}`)

        // 搜索最近60天内所有邮件（放宽时间范围）
        const searchCriteria = [
          ["SINCE", new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)]
        ]
        
        const fetchOptions = {
          bodies: ["HEADER.FIELDS (FROM SUBJECT IN-REPLY-TO REFERENCES MESSAGE-ID DATE)", "1", "2", "TEXT"],
          markSeen: false  // 不要标记为已读
        }
        
        const folderMessages = await connection.search(searchCriteria, fetchOptions)
        console.log(`[Email Reply Checker] Found ${folderMessages.length} messages in ${folderName}`)
        
        // 添加文件夹信息到每条消息
        const messagesWithFolder = folderMessages.map(msg => ({
          ...msg,
          folder: folderName
        }))
        allMessages.push(...messagesWithFolder)
        
      } catch (folderError) {
        console.log(`[Email Reply Checker] Cannot open folder ${folderName}: ${folderError}`)
      }
    }
    
    result.found = allMessages.length
    console.log(`[Email Reply Checker] Found total ${allMessages.length} messages across all folders`)

    for (const message of allMessages) {
      try {
        const header = message.parts[0].body
        
        const from = header.from ? header.from[0] : ""
        const subject = header.subject ? header.subject[0] : ""
        const inReplyTo = header["in-reply-to"] ? header["in-reply-to"][0] : ""
        const references = header.references ? header.references.join(" ") : ""
        const messageId = header["message-id"] ? header["message-id"][0] : ""
        const xSendId = header["x-send-id"] ? header["x-send-id"][0] : ""
        
        console.log(`[Email Reply Checker] Processing reply from: ${from}`)
        console.log(`[Email Reply Checker] Subject: ${subject}`)
        console.log(`[Email Reply Checker] In-Reply-To: ${inReplyTo}`)
        console.log(`[Email Reply Checker] References: ${references}`)
        console.log(`[Email Reply Checker] Message-ID: ${messageId}`)
        console.log(`[Email Reply Checker] X-Send-Id: ${xSendId}`)
        
        console.log(`[Email Reply Checker] Message from folder: ${message.folder || 'unknown'}`)
        
        // 优先使用 X-Send-Id（最可靠的自定义头）
        let sendId: string | null = null
        
        if (xSendId && xSendId.startsWith('send_')) {
          sendId = xSendId
          console.log(`[Email Reply Checker] Found sendId from X-Send-Id: ${sendId}`)
        }
        
        // 如果没有 X-Send-Id，尝试从其他头查找
        if (!sendId) {
          // 查找 sendId，格式：send_{userId}_{timestamp}_{random}@mornhub.top
          // 检查多个头：In-Reply-To, References, Message-ID
          const combinedReferences = `${inReplyTo} ${references} ${messageId}`
          console.log(`[Email Reply Checker] Combined: "${combinedReferences}"`)
          
          // 尝试匹配两种格式：
          // 1. send_userId_timestamp_random（有下划线分隔）
          // 2. send_userId_timestamprandom（没有下划线分隔）
          // 也需要匹配带@mornhub.top后缀的格式
          let sendIdMatch = combinedReferences.match(/send_([^_]+)_(\d+_[a-zA-Z0-9]+)/)
          
          if (!sendIdMatch) {
            // 尝试匹配没有下划线分隔的格式
            sendIdMatch = combinedReferences.match(/send_([^_]+)_(\d+[a-zA-Z0-9]+)/)
            if (sendIdMatch) {
              console.log(`[Email Reply Checker] Matched format without underscore: ${sendIdMatch[2]}`)
            }
          }
          
          if (!sendIdMatch) {
            // 尝试匹配带@mornhub.top后缀的完整格式
            sendIdMatch = combinedReferences.match(/send_([^_]+)_\d+_[a-zA-Z0-9]+@mornhub\.top/)
            if (sendIdMatch) {
              console.log(`[Email Reply Checker] Matched format with domain: ${sendIdMatch[0]}`)
            }
          }
          
          if (sendIdMatch) {
            sendId = `send_${sendIdMatch[1]}_${sendIdMatch[2]}`
          }
        }
        
        // 如果还是没有 sendId，尝试通过主题行+发件人匹配（适用于旧邮件）
        if (!sendId && subject && (subject.startsWith('回复：') || subject.startsWith('回复:'))) {
          // 处理中英文冒号
          const originalSubject = subject.replace(/^回复[：:]\s*/, '')
          // 从发件人提取邮箱地址
          const fromEmailMatch = from.match(/<(.+)>/)
          const fromEmail = fromEmailMatch ? fromEmailMatch[1] : from
          
          console.log(`[Email Reply Checker] Trying to match by subject: "${originalSubject}" and from: "${fromEmail}"`)
          
          // 查找所有发送记录
          const allSends = await dbAdapter.loadRows("ai_customer_email_sends", {})
          console.log(`[Email Reply Checker] Total sends in DB: ${allSends.length}`)
          
          // 优先：主题 + 发件人邮箱都匹配
          let potentialSends = allSends.filter(s => 
            s.subject === originalSubject && 
            s.to_email && fromEmail.includes(s.to_email.replace(/@.+$/, ''))
          )
          console.log(`[Email Reply Checker] Subject + Email match: ${potentialSends.length}`)
          
          // 次选：仅主题匹配
          if (potentialSends.length === 0) {
            potentialSends = allSends.filter(s => s.subject === originalSubject)
            console.log(`[Email Reply Checker] Subject only match: ${potentialSends.length}`)
          }
          
          // 末选：模糊主题匹配
          if (potentialSends.length === 0) {
            potentialSends = allSends.filter(s => s.subject && originalSubject.includes(s.subject))
            console.log(`[Email Reply Checker] Fuzzy subject match: ${potentialSends.length}`)
          }
          
          // 过滤出没有回复时间的记录
          const unmatchedSends = potentialSends.filter(s => !s.reply_time)
          console.log(`[Email Reply Checker] Unmatched sends (no reply_time): ${unmatchedSends.length}`)
          
          if (unmatchedSends.length > 0) {
            // 找到最接近的记录（按发送时间排序）
            const sorted = unmatchedSends.sort((a, b) => 
              new Date(b.send_time).getTime() - new Date(a.send_time).getTime()
            )
            sendId = sorted[0].id
            console.log(`[Email Reply Checker] Found sendId from subject+email match: ${sendId}, to: ${sorted[0].to_email}`)
          } else if (potentialSends.length > 0) {
            // 所有匹配的记录都已经有回复时间了，使用最新的一个
            const sorted = potentialSends.sort((a, b) => 
              new Date(b.send_time).getTime() - new Date(a.send_time).getTime()
            )
            sendId = sorted[0].id
            console.log(`[Email Reply Checker] Using sendId that already has reply_time: ${sendId}`)
          } else {
            console.log(`[Email Reply Checker] No matching send record found for subject`)
          }
        }
        
        if (sendId) {
          console.log(`[Email Reply Checker] Found sendId: ${sendId}`)
          // 注意：不再根据sendId中的userId过滤，因为旧邮件的userId格式可能不同
          // 通过主题匹配找到的记录视为有效回复
          
          console.log(`[Email Reply Checker] Looking up send record: ${sendId}`)
          const sendRows = await dbAdapter.loadRows("ai_customer_email_sends", { id: sendId })
          console.log(`[Email Reply Checker] Found ${sendRows.length} send records`)
          
          if (sendRows.length > 0) {
            const sendRecord = sendRows[0]
            console.log(`[Email Reply Checker] Send record user_id: ${sendRecord.user_id}`)
            
            // 不再验证user_id，因为主题匹配可能匹配到其他用户的记录
            // 获取邮件正文 - 优先获取纯文本，然后尝试HTML
            let replyBody = ""
            
            // 尝试获取纯文本部分 (通常是 "1")
            const textPart = message.parts.find(p => p.which === "1")
            console.log(`[Email Reply Checker] textPart found: ${!!textPart}`)
            if (textPart && textPart.body) {
              replyBody = textPart.body
              console.log(`[Email Reply Checker] textPart.body type: ${typeof textPart.body}, length: ${textPart.body.length}`)
            }
            
            // 如果没有纯文本，尝试HTML部分
            if (!replyBody) {
              const htmlPart = message.parts.find(p => p.which === "2")
              if (htmlPart && htmlPart.body) {
                replyBody = htmlPart.body
              }
            }
            
            // 最后的备选：完整TEXT
            if (!replyBody) {
              const fullText = message.parts.find(p => p.which === "TEXT")
              replyBody = fullText ? fullText.body : ""
            }
            
            // 解码 Base64 编码的内容
            if (replyBody && replyBody.length > 20) {
              try {
                // 移除换行符后尝试 Base64 解码
                const cleanBody = replyBody.replace(/[\r\n\s]/g, '')
                const isBase64 = /^[a-zA-Z0-9+/=]+$/.test(cleanBody) && cleanBody.length > 100
                console.log(`[Email Reply Checker] isBase64: ${isBase64}, cleanLength: ${cleanBody.length}`)
                
                if (isBase64) {
                  const decoded = Buffer.from(cleanBody, 'base64').toString('utf-8')
                  console.log(`[Email Reply Checker] decoded length: ${decoded.length}, preview: ${decoded.substring(0, 30)}`)
                  
                  // 检查解码后是否包含中文
                  if (/[\u4e00-\u9fa5]/.test(decoded)) {
                    replyBody = decoded
                    console.log(`[Email Reply Checker] Successfully decoded base64 content`)
                  }
                }
              } catch (e) {
                console.log(`[Email Reply Checker] Decode error: ${e}`)
              }
            }
            
            console.log(`[Email Reply Checker] replyBody length: ${replyBody.length}`)
            console.log(`[Email Reply Checker] replyBody preview: ${replyBody.substring(0, 100)}`)
            console.log(`[Email Reply Checker] Updating send record...`)
            await dbAdapter.updateRow("ai_customer_email_sends", { id: sendId }, {
              status: "replied",
              reply_time: new Date().toISOString(),
              reply_from: from,
              reply_body: replyBody,
              updated_at: new Date().toISOString()
            })
            
            result.processed++
            console.log(`[Email Reply Checker] Updated send record: ${sendId}`)
          } else {
            console.log(`[Email Reply Checker] Send record not found: ${sendId}`)
          }
        } else {
          console.log(`[Email Reply Checker] No valid sendId found - checking subject match result`)
        }
      } catch (error) {
        const errorMsg = `Error processing message: ${error}`
        console.error(`[Email Reply Checker] ${errorMsg}`)
        result.errors.push(errorMsg)
      }
    }

    await connection.end()
    console.log("[Email Reply Checker] Connection closed")
    
    result.success = true
    console.log(`[Email Reply Checker] Check completed. Found: ${result.found}, Processed: ${result.processed}`)
    
  } catch (error) {
    const errorMsg = `Error checking email replies: ${error}`
    console.error(`[Email Reply Checker] ${errorMsg}`)
    result.errors.push(errorMsg)
  }
  
  return result
}

export { checkEmailReplies, EmailReplyResult }
