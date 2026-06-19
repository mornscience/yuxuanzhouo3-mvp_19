import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
})

export interface ParsedResult {
  productCategories: string[]
  capacity: string
  priceRange: string
  qualityCertifications: string[]
  otherTags: string[]
}

export async function extractStructuredInfo(imageUrls: string[]): Promise<ParsedResult> {
  try {
    const messages: any[] = [
      {
        role: 'system',
        content: `你是一个企业产品画册解析专家。请分析上传的产品画册图片，提取以下结构化信息：
        
        1. 产品品类 (productCategories): 从文档中识别出的产品类别列表
        2. 产能规模 (capacity): 企业的生产能力描述
        3. 价格区间 (priceRange): 产品价格范围
        4. 质量认证 (qualityCertifications): 获得的质量认证和资质证书
        5. 其他标签 (otherTags): 其他相关的业务标签
        
        请以JSON格式输出，不要包含任何额外的解释文字。JSON格式如下：
        {
          "productCategories": ["类别1", "类别2"],
          "capacity": "产能描述",
          "priceRange": "价格范围",
          "qualityCertifications": ["认证1", "认证2"],
          "otherTags": ["标签1", "标签2"]
        }`
      }
    ]

    imageUrls.forEach((url) => {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: url
            }
          }
        ]
      })
    })

    messages.push({
      role: 'user',
      content: '请分析以上图片，提取产品品类、产能、价格区间、质量认证和其他标签信息，以JSON格式输出。'
    })

    const response = await openai.chat.completions.create({
      model: process.env.QWEN_VL_MODEL || 'qwen3-vl-plus',
      messages: messages,
      max_tokens: 2000,
      temperature: 0.1,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('大模型返回为空')
    }

    try {
      const parsed = JSON.parse(content)
      return parsed
    } catch {
      throw new Error('解析JSON失败')
    }
  } catch (error) {
    console.error('[Qwen] 多模态解析失败:', error)
    throw new Error('多模态解析失败')
  }
}