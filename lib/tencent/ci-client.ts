// 使用 cos-nodejs-sdk-v5 调用 CI API
const COS = require('cos-nodejs-sdk-v5')

const SECRET_ID = process.env.TENCENT_SECRET_ID!
const SECRET_KEY = process.env.TENCENT_SECRET_KEY!
const BUCKET = process.env.TENCENT_COS_BUCKET!
const REGION = process.env.TENCENT_COS_REGION!

// 创建 COS 客户端
const cos = new COS({
  SecretId: SECRET_ID,
  SecretKey: SECRET_KEY,
  Protocol: 'https:',
  Timeout: 60000,
})

console.log('[CI] 使用配置:', {
  BUCKET,
  REGION
})

/**
 * 使用 COS SDK 提交PDF转图片任务
 */
export async function submitPdfToImageTask(pdfUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 从URL中提取COS对象路径
    const cosObject = pdfUrl.replace(`https://${BUCKET}.cos.${REGION}.myqcloud.com/`, '')
    
    const timestamp = Date.now()
    
    console.log('[CI] 提交PDF转图片任务:', {
      cosObject,
      bucket: BUCKET,
      region: REGION
    })
    
    // 构建 XML 请求体
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <Tag>DocProcess</Tag>
  <Input>
    <Object>${cosObject}</Object>
  </Input>
  <Operation>
    <Output>
      <Region>${REGION}</Region>
      <Bucket>${BUCKET}</Bucket>
      <Object>pdf-images/${timestamp}_page_${'$'}{Number}.jpg</Object>
    </Output>
    <DocProcess>
      <TgtType>jpg</TgtType>
      <Quality>80</Quality>
    </DocProcess>
  </Operation>
</Request>`
    
    // 使用 COS SDK 的 request 方法调用 CI API
    // 注意：Bucket 参数使用完整存储桶名（包含 APP_ID）
    cos.request({
      Bucket: BUCKET,
      Region: REGION,
      Method: 'POST',
      Url: `https://${BUCKET}.ci.${REGION}.myqcloud.com/doc_jobs`,
      Body: body,
      Headers: {
        'Content-Type': 'application/xml',
      }
    }, (err: any, data: any) => {
      if (err) {
        console.error('[CI] 提交任务失败:', err)
        reject(new Error('CI任务提交失败: ' + err.message))
      } else {
        console.log('[CI] 提交任务成功:', data)
        // 解析响应获取JobId
        try {
          // 优先检查JSON格式响应
          if (data && data.Response && data.Response.JobsDetail && data.Response.JobsDetail.JobId) {
            console.log('[CI] 任务ID:', data.Response.JobsDetail.JobId)
            resolve(data.Response.JobsDetail.JobId)
          } else if (data && data.JobsDetail && data.JobsDetail.JobId) {
            console.log('[CI] 任务ID:', data.JobsDetail.JobId)
            resolve(data.JobsDetail.JobId)
          } else {
            // 尝试XML格式匹配
            const responseText = typeof data === 'object' ? JSON.stringify(data) : (data || '')
            const jobIdMatch = responseText.match(/<JobId>(.+?)<\/JobId>/)
            if (jobIdMatch && jobIdMatch[1]) {
              console.log('[CI] 任务ID:', jobIdMatch[1])
              resolve(jobIdMatch[1])
            } else {
              reject(new Error('无法从响应中获取JobId'))
            }
          }
        } catch (e: any) {
          reject(new Error('解析响应失败: ' + (e.message || e)))
        }
      }
    })
  })
}

/**
 * 等待文档处理任务完成
 */
export async function waitForDocProcess(jobId: string, maxRetries: number = 30, delayMs: number = 3000): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    let retries = 0
    
    const checkStatus = async () => {
      try {
        const result = await getDocProcessResult(jobId)
        console.log('[CI] 任务状态:', result)
        
        // 解析任务状态
        let state = ''
        let imageUrls: string[] = []
        
        if (result && result.Response && result.Response.JobsDetail) {
          state = result.Response.JobsDetail.State
          // 提取输出图片URL
          if (result.Response.JobsDetail.Operation && 
              result.Response.JobsDetail.Operation.Output && 
              result.Response.JobsDetail.Operation.Output.Object) {
            // 任务完成时会返回输出文件列表
            const output = result.Response.JobsDetail.Operation.Output
            if (output.Object && typeof output.Object === 'string') {
              // 如果是单个文件
              imageUrls = [`https://${BUCKET}.cos.${REGION}.myqcloud.com/${output.Object}`]
            }
          }
        } else if (result && result.JobsDetail) {
          state = result.JobsDetail.State
        }
        
        console.log('[CI] 任务状态:', state)
        
        if (state === 'Success') {
          // 任务成功，提取图片URL
          console.log('[CI] 任务成功，开始提取图片URL...')
          console.log('[CI] 任务详情:', JSON.stringify(result))
          
          // 获取实际页数（从任务结果中读取）
          const actualPageCount = result?.Response?.JobsDetail?.Operation?.DocProcessResult?.TotalPageCount || 
                                  result?.Response?.JobsDetail?.TotalPageCount || 
                                  result?.JobsDetail?.TotalPageCount || 
                                  result?.Response?.JobsDetail?.Operation?.DocProcessResult?.SuccPageCount || 0
          console.log('[CI] PDF实际页数:', actualPageCount)
          
          // 设置最多20页的限制
          const maxPages = 20
          const pageCount = Math.min(actualPageCount > 0 ? actualPageCount : 1, maxPages)
          console.log('[CI] 处理页数（最多20页）:', pageCount)
          
          // 需要根据实际响应格式提取图片URL
          const extractedUrls = extractImageUrlsFromResult(result, pageCount)
          console.log('[CI] 提取到图片URL:', extractedUrls)
          resolve(extractedUrls.length > 0 ? extractedUrls : imageUrls)
        } else if (state === 'Failed') {
          reject(new Error('文档处理任务失败'))
        } else if (state === 'Submitted' || state === 'Running') {
          // 任务还在进行中
          retries++
          if (retries >= maxRetries) {
            reject(new Error('文档处理超时'))
          } else {
            console.log(`[CI] 任务处理中，等待 ${delayMs}ms 后重试 (${retries}/${maxRetries})`)
            setTimeout(checkStatus, delayMs)
          }
        } else {
          retries++
          if (retries >= maxRetries) {
            reject(new Error('文档处理超时'))
          } else {
            setTimeout(checkStatus, delayMs)
          }
        }
      } catch (error: any) {
        console.error('[CI] 查询任务状态失败:', error)
        retries++
        if (retries >= maxRetries) {
          reject(new Error('查询任务状态失败: ' + error.message))
        } else {
          setTimeout(checkStatus, delayMs)
        }
      }
    }
    
    checkStatus()
  })
}

/**
 * 从响应结果中提取图片URL
 */
function extractImageUrlsFromResult(result: any, pageCount: number = 1): string[] {
  const urls: string[] = []
  
  try {
    // 尝试多种可能的响应格式
    const output = result?.Response?.JobsDetail?.Operation?.Output || 
                   result?.JobsDetail?.Operation?.Output
    
    if (output) {
      // 如果有多个输出文件
      if (output.Object && typeof output.Object === 'string') {
        // 处理 ${Number} 占位符
        const objectPath = output.Object
        const baseUrl = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${objectPath}`
        
        // 检查是否包含占位符
        if (baseUrl.includes('${Number}')) {
          // 使用传入的实际页数，最多100页
          const actualPageCount = Math.min(pageCount, 100)
          
          // 生成实际的图片URL（从1开始）
          for (let i = 1; i <= actualPageCount; i++) {
            urls.push(baseUrl.replace(/\$\{Number\}/g, i.toString()))
          }
        } else {
          // 单个文件
          urls.push(baseUrl)
        }
      }
    }
  } catch (e) {
    console.error('[CI] 提取图片URL失败:', e)
  }
  
  return urls
}

/**
 * 查询任务状态
 */
export async function getDocProcessResult(jobId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('[CI] 查询任务状态:', { jobId })
    
    cos.request({
      Bucket: BUCKET,
      Region: REGION,
      Method: 'GET',
      Url: `https://${BUCKET}.ci.${REGION}.myqcloud.com/doc_jobs/${jobId}`,
      Headers: {
        'Content-Type': 'application/xml',
      }
    }, (err: any, data: any) => {
      if (err) {
        console.error('[CI] 查询任务失败:', err)
        reject(new Error('CI任务查询失败: ' + err.message))
      } else {
        console.log('[CI] 查询任务成功:', data)
        resolve(data)
      }
    })
  })
}
