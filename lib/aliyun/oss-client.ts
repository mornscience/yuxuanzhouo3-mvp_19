import OSS from 'ali-oss'

const client = new OSS({
  accessKeyId: process.env.ALI_ACCESS_KEY_ID!,
  accessKeySecret: process.env.ALI_ACCESS_KEY_SECRET!,
  region: process.env.OSS_REGION!,
  bucket: process.env.OSS_BUCKET!,
})

export async function uploadToOss(file: Buffer, filename: string): Promise<string> {
  try {
    const result = await client.put(`pdf/${Date.now()}-${filename}`, file)
    console.log('[OSS] 文件上传成功:', result.url)
    return result.url
  } catch (error) {
    console.error('[OSS] 文件上传失败:', error)
    throw new Error('OSS上传失败')
  }
}

export async function getOssFileUrl(filename: string): Promise<string> {
  try {
    const url = client.signatureUrl(filename)
    return url
  } catch (error) {
    console.error('[OSS] 获取文件URL失败:', error)
    throw new Error('获取文件URL失败')
  }
}