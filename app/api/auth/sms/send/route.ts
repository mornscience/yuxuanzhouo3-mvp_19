import { NextRequest, NextResponse } from "next/server"
import { createHmac, createHash } from "crypto"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/auth/sms/send  { phone }
export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, message: "Please enter a valid phone number" }, { status: 400 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  // 存储验证码到数据库（解决 serverless 多实例问题）
  const sb = await getSupabase()
  await sb.from("sms_codes").upsert(
    { phone, code, expires_at: expiresAt },
    { onConflict: "phone" }
  )

  const secretId = process.env.TENCENT_SMS_SECRET_ID
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY
  const sdkAppId = process.env.TENCENT_SMS_APP_ID
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || ""
  const signName = process.env.TENCENT_SMS_SIGN_NAME || ""

  if (secretId && secretKey && sdkAppId) {
    try {
      const bodyObj = {
        SmsSdkAppId: sdkAppId,
        SignName: signName,
        TemplateId: templateId,
        TemplateParamSet: [code, "5"],
        PhoneNumberSet: [`+86${phone}`],
      }
      const bodyStr = JSON.stringify(bodyObj)
      const timestamp = Math.floor(Date.now() / 1000)
      const authorization = buildTencentAuth(secretId, secretKey, timestamp, bodyStr)

      const res = await fetch("https://sms.tencentcloudapi.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Action": "SendSms",
          "X-TC-Version": "2021-01-11",
          "X-TC-Timestamp": String(timestamp),
          "X-TC-Region": "ap-guangzhou",
          "Authorization": authorization,
          "Host": "sms.tencentcloudapi.com",
        },
        body: bodyStr,
      })
      const data = await res.json()
      console.log("[SMS]", JSON.stringify(data))
    } catch (e) {
      console.error("[SMS send error]", e)
    }
  } else {
    console.log(`[SMS DEV] Phone ${phone} code: ${code}`)
  }

  return NextResponse.json({ ok: true, message: "Verification code sent, valid for 5 minutes" })
}

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex")
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

function buildTencentAuth(secretId: string, secretKey: string, timestamp: number, body: string): string {
  const service = "sms"
  const host = "sms.tencentcloudapi.com"
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10)

  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`
  const signedHeaders = "content-type;host"
  const hashedPayload = sha256Hex(body)
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`

  const credentialScope = `${date}/${service}/tc3_request`
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`

  const secretDate = hmacSha256(`TC3${secretKey}`, date)
  const secretService = hmacSha256(secretDate, service)
  const secretSigning = hmacSha256(secretService, "tc3_request")
  const signature = createHmac("sha256", secretSigning).update(stringToSign, "utf8").digest("hex")

  return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}
