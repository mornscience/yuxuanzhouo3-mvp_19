export interface ParsedResult {
  productCategories: string[]
  capacity: string
  priceRange: string
  qualityCertifications: string[]
  otherTags: string[]
}

// 使用腾讯云官方SDK调用混元API
const tencentcloud = require('tencentcloud-sdk-nodejs')

const SECRET_ID = process.env.TENCENT_SECRET_ID!
const SECRET_KEY = process.env.TENCENT_SECRET_KEY!

// 初始化混元客户端
const HunyuanClient = tencentcloud.hunyuan.v20230901.Client
const clientConfig = {
  credential: {
    secretId: SECRET_ID,
    secretKey: SECRET_KEY,
  },
  region: "ap-beijing",
  profile: {
    httpProfile: {
      endpoint: "hunyuan.tencentcloudapi.com",
    },
  },
}

const client = new HunyuanClient(clientConfig)

export async function extractStructuredInfo(imageUrls: string[]): Promise<ParsedResult> {
  try {
    const model = 'hunyuan-vision'
    
    // 构建消息 - 混元API需要纯文本格式
    // 将图片URL以markdown格式放在文本中
    const imageLinks = imageUrls.map((url, i) => `![Page ${i + 1}](${url})`).join('\n\n')
    
    const userText = `${imageLinks}

Please analyze the product catalog images above and extract the following structured information:
1. productCategories: List of product categories identified from the document
2. capacity: Description of the enterprise's production capacity
3. priceRange: Product price range (if there is a clear price in the document, fill it in; if not, give a reference price range based on the product type and market conditions, such as "Negotiable" or "Priced according to product specifications")
4. qualityCertifications: Quality certifications and qualification certificates obtained
5. otherTags: Other relevant business tags

Please output in JSON format only, without any additional explanatory text. JSON format:
{
  "productCategories": ["Category 1", "Category 2"],
  "capacity": "Capacity description",
  "priceRange": "Reference price range or \"Negotiable\"",
  "qualityCertifications": ["Certification 1", "Certification 2"],
  "otherTags": ["Tag 1", "Tag 2"]
}`

    const messages = [
      {
        Role: 'user',
        Content: userText
      }
    ]

    console.log('[Hunyuan] 请求模型:', model)
    console.log('[Hunyuan] 请求图片数量:', imageUrls.length)
    console.log('[Hunyuan] 请求图片URL:', imageUrls)

    // 调用混元API
    const params = {
      Model: model,
      Messages: messages,
      Stream: false
    }

    const result = await client.ChatCompletions(params)
    
    console.log('[Hunyuan] 完整响应:', JSON.stringify(result))
    
    // 检查是否有错误
    if (result.Error) {
      throw new Error('混元API错误: ' + result.Error.Message || JSON.stringify(result.Error))
    }
    
    // 解析响应 - 响应直接在顶层
    const choices = result.Choices || result.Response?.Choices
    const content = choices?.[0]?.Message?.Content || choices?.[0]?.delta?.content
    
    if (!content) {
      throw new Error('混元模型返回为空')
    }

    const contentText = content
    console.log('[Hunyuan] 响应内容:', contentText)
    
    try {
      const parsed = JSON.parse(contentText)
      return parsed as ParsedResult
    } catch {
      throw new Error('解析JSON失败: ' + contentText.substring(0, 100))
    }
  } catch (error: any) {
    console.error('[Hunyuan] 多模态解析失败:', error)
    throw new Error('多模态解析失败: ' + error.message)
  }
}