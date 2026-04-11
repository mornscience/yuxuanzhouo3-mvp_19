import { NextRequest, NextResponse } from "next/server"
import { createHash, createSign } from "crypto"
import { randomUUID } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

function getPrivateKey() {
  const raw = process.env.WECHAT_PAY_PRIVATE_KEY || ""
  return raw.replace(/\\n/g, "\n")
}

function sign(message: string) {
  const sign = createSign("RSA-SHA256")
  sign.update(message)
  return sign.sign(getPrivateKey(), "base64")
}

function buildAuthorization(method: string, url: string, body: string) {
  const mchId = process.env.WECHAT_PAY_MCH_ID!
  const serialNo = process.env.WECHAT_PAY_SERIAL_NO!
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomUUID().replace(/-/g, "").slice(0, 32)
  const urlObj = new URL(url)
  const canonicalUrl = urlObj.pathname + (urlObj.search || "")
  const message = `${method}\n${canonicalUrl}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = sign(message)
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  try {
    const { amount, planId, planName } = await req.json()
    if (!amount || amount <= 0) return NextResponse.json({ ok: false, message: "金额无效" }, { status: 400 })

    const appId = process.env.WECHAT_PAY_APP_ID!
    const mchId = process.env.WECHAT_PAY_MCH_ID!
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const outTradeNo = `WX${Date.now()}${randomUUID().slice(0, 6).toUpperCase()}`

    const body = JSON.stringify({
      appid: appId,
      mchid: mchId,
      description: planName || "mornbusiness 会员",
      out_trade_no: outTradeNo,
      notify_url: `${baseUrl}/api/payment/wechat/notify`,
      amount: { total: Math.round(amount * 100), currency: "CNY" },
      attach: JSON.stringify({ userId, planId }),
    })

    const apiUrl = "https://api.mch.weixin.qq.com/v3/pay/transactions/native"
    const authorization = buildAuthorization("POST", apiUrl, body)

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authorization,
        "Accept": "application/json",
      },
      body,
    })

    const data = await res.json()
    if (!res.ok || !data.code_url) {
      console.error("[WechatPay] 创建订单失败:", data)
      return NextResponse.json({ ok: false, message: data.message || "创建微信支付订单失败" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, codeUrl: data.code_url, outTradeNo })
  } catch (e: any) {
    console.error("[WechatPay]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
