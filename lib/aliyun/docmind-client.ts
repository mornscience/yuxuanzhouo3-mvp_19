const REGION_ID = process.env.DOCMIND_REGION || 'cn-beijing'
const ACCESS_KEY_ID = process.env.ALI_ACCESS_KEY_ID!
const ACCESS_KEY_SECRET = process.env.ALI_ACCESS_KEY_SECRET!

function generateSignature(url: string, method: string, headers: Record<string, string>, body?: string): string {
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
  const nonce = Math.random().toString(36).substr(2, 9)
  
  const signHeaders = Object.keys(headers).sort().map(k => `${k.toLowerCase()}:${headers[k]}`).join('\n')
  const canonicalQueryString = ''
  const canonicalHeaders = `${signHeaders}\n`
  const signedHeaders = Object.keys(headers).sort().join(';')
  
  const payload = body || ''
  const payloadHash = require('crypto').createHash('sha256').update(payload).digest('hex')
  
  const canonicalRequest = [method, url, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join('\n')
  
  const credentialScope = `${timestamp.substring(0, 8)}/${REGION_ID}/docmind/api_request`
  const stringToSign = `SHA256\n${timestamp}\n${credentialScope}\n${require('crypto').createHash('sha256').update(canonicalRequest).digest('hex')}`
  
  const kSecret = `ALIYUN${ACCESS_KEY_SECRET}`
  const kDate = require('crypto').createHmac('sha256', kSecret).update(timestamp.substring(0, 8)).digest()
  const kRegion = require('crypto').createHmac('sha256', kDate).update(REGION_ID).digest()
  const kService = require('crypto').createHmac('sha256', kRegion).update('docmind').digest()
  const kSigning = require('crypto').createHmac('sha256', kService).update('api_request').digest()
  
  const signature = require('crypto').createHmac('sha256', kSigning).update(stringToSign).digest('hex')
  
  return `SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

export async function analyzeDocument(fileUrl: string): Promise<string> {
  try {
    const url = `/api/document/v1/analyze`
    const endpoint = `https://docmind.${REGION_ID}.aliyuncs.com${url}`
    
    const body = JSON.stringify({
      SourceType: 'URL',
      SourceUri: fileUrl,
      Features: ['OCR', 'LAYOUT'],
    })
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body).toString(),
      'Host': `docmind.${REGION_ID}.aliyuncs.com`,
    }
    
    const signature = generateSignature(url, 'POST', headers, body)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': signature,
      },
      body: body,
    })
    
    const result = await response.json()
    
    if (result.Success) {
      return result.TaskId
    } else {
      throw new Error(result.Message || '文档解析失败')
    }
  } catch (error: any) {
    console.error('[DocMind] 文档解析失败:', error)
    throw new Error('文档智能解析失败')
  }
}

export async function getDocumentResult(taskId: string): Promise<any> {
  try {
    const url = `/api/document/v1/result?TaskId=${taskId}`
    const endpoint = `https://docmind.${REGION_ID}.aliyuncs.com${url}`
    
    const headers: Record<string, string> = {
      'Host': `docmind.${REGION_ID}.aliyuncs.com`,
    }
    
    const signature = generateSignature(url, 'GET', headers)
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...headers,
        'Authorization': signature,
      },
    })
    
    return await response.json()
  } catch (error: any) {
    console.error('[DocMind] 获取解析结果失败:', error)
    throw new Error('获取文档解析结果失败')
  }
}

export async function waitForDocumentResult(taskId: string): Promise<any> {
  let retries = 0
  const maxRetries = 30
  const delay = 3000

  while (retries < maxRetries) {
    const result = await getDocumentResult(taskId)
    
    if (result.Status === 'SUCCEEDED') {
      return result
    }
    
    if (result.Status === 'FAILED') {
      throw new Error(result.Message || '文档解析任务失败')
    }

    retries++
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  throw new Error('文档解析任务超时')
}