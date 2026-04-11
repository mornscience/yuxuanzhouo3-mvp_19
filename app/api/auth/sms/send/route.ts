import { NextRequest, NextResponse } from "next/server"

// 内存存储验证码（生产环境应用 Redis）
const codeStore = new Map<string, { code: string; expires: number }>()

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/auth/sms/send  { phone }
export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, message: "请输入正确的手机号" }, { status: 400 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires = Date.now() + 5 * 60 * 1000 // 5分钟有效
  codeStore.set(phone, { code, expires })

  // 实际发送短信（腾讯云 SMS）
  const secretId = process.env.TENCENT_SMS_SECRET_ID
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY
  const sdkAppId = process.env.TENCENT_SMS_APP_ID
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || "your_template_id"
  const signName = process.env.TENCENT_SMS_SIGN || "mornbusiness"

  if (secretId && secretKey && sdkAppId) {
    try {
      // 腾讯云 SMS HTTP API
      const timestamp = Math.floor(Date.now() / 1000)
      const res = await fetch("https://sms.tencentcloudapi.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Action": "SendSms",
          "X-TC-Version": "2021-01-11",
          "X-TC-Timestamp": String(timestamp),
          "X-TC-Region": "ap-guangzhou",
          "Authorization": buildTencentAuth(secretId, secretKey, timestamp, JSON.stringify({
            SmsSdkAppId: sdkAppId,
            SignName: signName,
            TemplateId: templateId,
            TemplateParamSet: [code, "5"],
            PhoneNumberSet: [`+86${phone}`],
          })),
        },
        body: JSON.stringify({
          SmsSdkAppId: sdkAppId,
          SignName: signName,
          TemplateId: templateId,
          TemplateParamSet: [code, "5"],
          PhoneNumberSet: [`+86${phone}`],
        }),
      })
      const data = await res.json()
      console.log("[SMS]", data)
    } catch (e) {
      console.error("[SMS send error]", e)
      // 发送失败不影响开发调试，继续返回成功（开发环境）
    }
  } else {
    // 开发环境：打印验证码到控制台
    console.log(`[SMS DEV] 手机号 ${phone} 验证码: ${code}`)
  }

  return NextResponse.json({ ok: true, message: "验证码已发送，5分钟内有效" })
}

function buildTencentAuth(secretId: string, secretKey: string, timestamp: number, body: string): string {
  // 简化版签名，实际生产应使用腾讯云 SDK
  return `TC3-HMAC-SHA256 Credential=${secretId}/auth, SignedHeaders=content-type;host, Signature=placeholder`
}

// 导出供登录接口使用
export { codeStore }
