import COS from 'cos-nodejs-sdk-v5'

const cos = new COS({
  SecretId: process.env.TENCENT_SECRET_ID!,
  SecretKey: process.env.TENCENT_SECRET_KEY!,
  Protocol: 'https:',
  Timeout: 60000,
})

const BUCKET = process.env.TENCENT_COS_BUCKET!
const REGION = process.env.TENCENT_COS_REGION!

console.log('[COS] 初始化配置:', {
  SecretId: process.env.TENCENT_SECRET_ID?.substring(0, 10) + '...',
  Bucket: BUCKET,
  Region: REGION,
})

export async function uploadToCos(fileBuffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const key = `pdf/${Date.now()}-${filename}`
    
    console.log('[COS] 准备上传:', {
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      ContentLength: fileBuffer.length,
    })
    
    cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Body: fileBuffer,
      ACL: 'public-read',
      StorageClass: 'STANDARD',
    }, (err, data) => {
      if (err) {
        console.error('[COS] 文件上传失败:', err)
        console.error('[COS] 错误详情:', JSON.stringify(err, null, 2))
        reject(new Error('COS上传失败: ' + err.message))
      } else {
        const url = `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`
        console.log('[COS] 文件上传成功:', url)
        resolve(url)
      }
    })
  })
}

export function getCosFileUrl(key: string): string {
  return `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`
}

// 设置COS对象为公开读取
export async function setCosObjectPublicRead(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    cos.putObjectAcl({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      ACL: 'public-read',
    }, (err: any) => {
      if (err) {
        console.error('[COS] 设置公开读取失败:', key, err.message)
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

// 获取COS图片的预签名URL（用于第三方服务访问）
export async function getCosSignedUrl(key: string, expires = 3600): Promise<string> {
  return new Promise((resolve, reject) => {
    cos.getObjectUrl({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Sign: true,
      Expires: expires,
    }, (err: any, data: any) => {
      if (err) {
        reject(new Error('获取签名URL失败: ' + err.message))
      } else {
        // COS SDK 回调返回的是对象 { Url: string }，需要提取 Url 字段
        // 兼容处理：可能是对象、也可能是字符串（不同 SDK 版本）
        const urlStr = typeof data === 'string'
          ? data
          : (data?.Url || data?.url || String(data))
        if (!urlStr || urlStr === '[object Object]') {
          reject(new Error('获取签名URL失败: 返回数据异常 ' + JSON.stringify(data).substring(0, 200)))
        } else {
          resolve(urlStr)
        }
      }
    })
  })
}

// 获取COS预签名的 PUT URL（用于前端直传）
// 前端拿到这个 URL 后可以直接用 PUT 方法上传文件，绕过 Vercel body size 限制
export async function getCosPresignedUploadUrl(key: string, expires = 1800): Promise<{ url: string; key: string; bucket: string; region: string }> {
  return new Promise((resolve, reject) => {
    // 使用 getAuthUrl 生成预签名 URL（比 getObjectUrl 更可靠，支持所有 HTTP 方法）
    cos.getAuthUrl({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Method: 'PUT',
      Sign: true,
      Expires: expires,
      Headers: {
        'Content-Type': 'application/pdf',
      },
    }, (err: any, data: any) => {
      if (err) {
        console.error('[COS] 获取预签名URL失败:', err.message || err)
        reject(new Error('获取预签名URL失败: ' + (err.message || String(err))))
      } else {
        // cos.getAuthUrl 返回的是预签名 URL 字符串
        const urlStr = typeof data === 'string' 
          ? data 
          : (data?.Url || data?.url || String(data))
        
        if (!urlStr || urlStr === '[object Object]') {
          reject(new Error('获取预签名URL失败: 返回数据异常 ' + JSON.stringify(data).substring(0, 200)))
        } else {
          console.log('[COS] 预签名URL生成成功, Key:', key, '有效期:', expires, '秒')
          resolve({
            url: urlStr,
            key,
            bucket: BUCKET,
            region: REGION,
          })
        }
      }
    })
  })
}

// 下载COS文件并转为base64
// 使用 签名URL + fetch 的方式，避免 COS SDK getObject 返回格式不确定的问题
export async function getCosFileAsBase64(key: string): Promise<string> {
  // 确保 key 不以 / 开头（COS key 规范）
  const normalizedKey = key.replace(/^\//, '')
  // 1. 先生成预签名 URL
  const signedUrl = await getCosSignedUrl(normalizedKey, 600)
  
  // 2. 用 fetch 下载，100% 保证格式正确
  console.log('[COS] fetch下载:', key.substring(0, 60))
  const resp = await fetch(signedUrl, { method: 'GET' })
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '')
    throw new Error(`下载COS文件失败 HTTP ${resp.status}: ${errText.substring(0, 80)}`)
  }
  const ab = await resp.arrayBuffer()
  const buffer = Buffer.from(ab)
  const mimeType = detectMimeType(key)
  console.log('[COS] 下载完成, 大小:', buffer.length)
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

function detectMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
  }
  return mimeMap[ext] || 'image/jpeg'
}