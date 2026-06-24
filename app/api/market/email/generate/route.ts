import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"
import { getAIProvider } from "@/lib/ai/provider"

export async function POST(request: Request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const {
      customerId,
      customerName,
      customerEmail,
      customerIndustry,
      customerBusinessType,
      customerProductCategories,
      customerCertifications,
      myProductCategories,
      myCertifications,
      industry
    } = body

    // 获取用户企业画像信息
    const profileRows = await dbAdapter.loadRows("user_market_profiles", { user_id: userId })
    if (profileRows.length === 0) {
      return NextResponse.json({ ok: false, message: "User profile not found" }, { status: 404 })
    }

    const profile = profileRows[0]
    const companyName = profile.company_name || profile.companyName || "Our Company"
    const contactPerson = profile.contact_person || profile.contactPerson || "Contact Person"
    const contactPhone = profile.contact_phone || profile.contactPhone || ""
    const companyWebsite = profile.company_website || profile.companyWebsite || ""

    // 构建AI Prompt
    const prompt = `
You are a professional international trade business development expert. 
Please write a personalized English cold email to a potential overseas customer.

Customer Information:
- Company Name: ${customerName}
- Industry: ${customerIndustry}
- Business Type: ${customerBusinessType}
- Product Categories: ${customerProductCategories.join(', ')}
- Certifications: ${customerCertifications.join(', ') || 'None'}

Our Company Information:
- Company Name: ${companyName}
- Industry: ${industry || 'Related Industry'}
- Product Categories: ${myProductCategories.join(', ')}
- Certifications: ${myCertifications.join(', ') || 'None'}
- Contact Person: ${contactPerson}
- Contact Phone: ${contactPhone}

Email Requirements:
1. Professional and friendly business tone
2. Highlight matching points between our products and their business
3. Include clear call-to-action
4. English only, authentic business English
5. Keep it concise (3-4 paragraphs)
6. Personalized greeting

Please output ONLY the email subject and body in JSON format:
{
  "subject": "Your subject here",
  "body": "Your email body here"
}
`

    // 调用AI生成邮件
    const ai = getAIProvider("market-email")
    const response = await ai.chat([
      { role: "system", content: "You are a professional email writer specialized in international business development." },
      { role: "user", content: prompt }
    ])

    let result
    try {
      // 清理AI返回的内容：移除可能的反引号包围和多余字符
      let cleanResponse = response.trim()
      
      // 移除 ```json 和 ``` 包围
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.slice(7)
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.slice(3)
      }
      if (cleanResponse.endsWith("```")) {
        cleanResponse = cleanResponse.slice(0, -3)
      }
      
      // 移除可能的前后引号
      cleanResponse = cleanResponse.replace(/^["']|["']$/g, '')
      
      // 解析JSON
      result = JSON.parse(cleanResponse)
      
      // 如果subject重复（如AI返回了两次），只取最后一个
      if (typeof result === 'object' && result !== null) {
        // 确保subject和body存在
        if (!result.subject) {
          result.subject = `Business Cooperation Opportunity - ${companyName}`
        }
        if (!result.body) {
          result.body = cleanResponse
        }
        
        // 处理转义字符，将 \n\n 转换为实际换行
        if (result.body) {
          result.body = result.body.replace(/\\n\\n/g, '\n\n').replace(/\\n/g, '\n')
        }
        
        // 在邮件末尾添加官网地址引导语
        if (companyWebsite && result.body) {
          result.body = result.body.trim() + '\n\n' + 
            `If you're interested in learning more about our products and services, please visit our official website: ${companyWebsite}`
        }
      }
    } catch {
      // 如果JSON解析失败，直接使用返回内容作为邮件正文
      result = {
        subject: `Business Cooperation Opportunity - ${companyName}`,
        body: response.replace(/```[\s\S]*?```/g, '').trim()
      }
    }

    // 保存草稿
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await dbAdapter.insertRow("ai_customer_email_drafts", {
      id: draftId,
      user_id: userId,
      customer_id: customerId,
      customer_name: customerName,
      customer_email: customerEmail,
      subject: result.subject,
      body: result.body,
      status: 'draft',
      ai_generated: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      ok: true,
      message: "Email generated successfully",
      draftId,
      subject: result.subject,
      body: result.body
    })

  } catch (error: any) {
    console.error("Email generation error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to generate email"
    }, { status: 500 })
  }
}
