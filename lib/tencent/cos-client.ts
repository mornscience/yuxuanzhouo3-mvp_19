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

export async function getCosFileUrl(key: string): Promise<string> {
  return `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`
}