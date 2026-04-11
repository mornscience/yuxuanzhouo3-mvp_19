import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { sendEmail } from "@/lib/market/send-email"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

function nowIso() { return new Date().toISOString() }
function expiresAt() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// AI 搜索：调用 web search + LLM 提取
async function aiSearchAndExtract(query: string, type: string): Promise<{ name: string; email: string; website: string; description: string; rawContent: string }[]> {
  const typeLabel = type === "blogger" ? "博主/KOL" : type === "enterprise" ? "企业/公司" : "VC投资机构"

  const aliyunKey = process.env.ALIYUN_DASHSCOPE_API_KEY
  const openrouterKey = process.env.OPENROUTER_API_KEY

  let apiKey: string
  let baseUrl: string
  let model: string
  let isAliyun: boolean

  if (aliyunKey) {
    apiKey = aliyunKey
    baseUrl = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    model = "qwen-plus-latest"
    isAliyun = true
  } else if (openrouterKey) {
    apiKey = openrouterKey
    baseUrl = "https://openrouter.ai/api/v1"
    model = "perplexity/sonar"
    isAliyun = false
  } else {
    return [{
      name: `${query} (模拟数据)`,
      email: `contact@${query.toLowerCase().replace(/\s+/g, "")}.com`,
      website: `https://www.${query.toLowerCase().replace(/\s+/g, "")}.com`,
      description: `请配置 AI API Key 获取真实数据。`,
      rawContent: "模拟数据",
    }]
  }

  const systemPrompt = `你是一个专业的商业信息搜索助手，必须通过联网搜索获取真实信息。

核心任务：找到${typeLabel}的联系邮箱。

搜索策略（必须按顺序执行）：
1. 搜索「${query} 邮箱」「${query} 商务合作邮箱」「${query} 联系方式」
2. 搜索「${query} B站 简介」「${query} 知乎 简介」「${query} 微博 简介」「${query} 抖音 简介」
3. 搜索「${query} 官网」「${query} site:bilibili.com」「${query} site:zhihu.com」
4. 查找各平台主页简介中的邮箱（格式如 xxx@xxx.com 或 xxx@qq.com）

邮箱提取规则：
- 若找到明确邮箱（含@符号），直接使用，标注 emailSource 为"公开"
- 若未找到但有官网域名，推断商务邮箱如 bd@域名、pr@域名、cooperation@域名，标注 emailSource 为"推断"
- 若完全无法推断，email 填空字符串

只返回 JSON 数组，不要任何其他文字：
[
  {
    "name": "昵称",
    "platform": "找到信息的平台",
    "email": "邮箱（找到或推断的）",
    "emailSource": "公开/推断/未找到",
    "website": "主页链接",
    "description": "简介50字以内"
  }
]`

  const userPrompt = `联网搜索${typeLabel}「${query}」的邮箱和联系方式，重点搜索 B站、知乎、微博、抖音、官网等平台的简介页面，提取其中的邮箱地址。最多返回5条结果。`

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
  }

  if (isAliyun) body.enable_search = true

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[ai-search] API error ${res.status}:`, errText)
    throw new Error(`AI API 错误: ${res.status}`)
  }

  const data = await res.json()

  // 兼容阿里云多轮返回（取最后一条 assistant content）
  let content = ""
  const choices = data.choices || []
  for (const choice of choices) {
    const msg = choice.message
    if (msg?.role === "assistant" && typeof msg.content === "string" && msg.content.trim()) {
      content = msg.content.trim()
    }
  }
  if (!content) content = choices[0]?.message?.content || ""

  console.log("[ai-search] raw content:", content.slice(0, 500))

  try {
    // 提取 JSON 数组，兼容 markdown 代码块包裹
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\[[\s\S]*\])/)
    const jsonStr = jsonMatch?.[1] || jsonMatch?.[0] || "[]"
    const results = JSON.parse(jsonStr.trim())
    if (!Array.isArray(results) || results.length === 0) return []
    return results.map((r: any) => ({
      name: String(r.name || ""),
      email: String(r.email || ""),
      website: String(r.website || ""),
      description: r.email
        ? `${String(r.description || "")}${r.emailSource === "推断" ? "【邮箱为推断】" : ""}`
        : (r.emailNote || "暂无公开邮箱，请手动填写"),
      rawContent: content,
    }))
  } catch (e) {
    console.error("[ai-search] JSON parse error:", e, "content:", content.slice(0, 200))
    return []
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  const body = await req.json()
  const { query, type } = body

  if (!query?.trim()) return NextResponse.json({ ok: false, message: "请输入搜索关键词" }, { status: 400 })
  if (!["blogger", "enterprise", "vc"].includes(type)) return NextResponse.json({ ok: false, message: "类型无效" }, { status: 400 })

  const COST_PER_CALL = 0.0005  // 每次真实成本，¥0.1 = 200次

  try {
    const sb = await getSupabase()

    // 查用户个人额度，不存在则自动初始化（兼容老用户）
    let { data: quotaRows } = await sb.from("ai_search_quota").select("*").eq("user_id", userId)
    if (!quotaRows?.length) {
      await sb.from("ai_search_quota").upsert({
        id: `quota-${randomUUID().slice(0, 8)}`,
        user_id: userId, balance: 0.1, total_used: 0, call_count: 0,
        created_at: nowIso(), updated_at: nowIso(),
      }, { onConflict: "user_id" })
      const { data: refetch } = await sb.from("ai_search_quota").select("*").eq("user_id", userId)
      quotaRows = refetch
    }
    const quota = quotaRows?.[0]
    const balance = parseFloat(quota?.balance ?? "0")
    const totalUsed = parseFloat(quota?.total_used ?? "0")
    const callCount = quota?.call_count ?? 0

    // 余额不足拦截
    if (balance < COST_PER_CALL) {
      const remainingCalls = Math.floor(balance / COST_PER_CALL)
      return NextResponse.json({
        ok: false,
        message: `AI 搜索余额不足（剩余 ¥${balance.toFixed(4)}，约 ${remainingCalls} 次），请联系管理员充值`,
        code: "BALANCE_INSUFFICIENT",
        quota: { balance, totalUsed, callCount, costPerCall: COST_PER_CALL, remainingCalls },
      }, { status: 429 })
    }

    const results = await aiSearchAndExtract(query.trim(), type)
    if (!results.length) return NextResponse.json({ ok: false, message: "未找到相关结果" }, { status: 404 })

    const rows = results.map(r => ({
      id: `asl-${randomUUID().slice(0, 8)}`,
      user_id: userId,
      query: query.trim(),
      name: r.name, email: r.email, website: r.website,
      description: r.description, type,
      raw_content: r.rawContent,
      email_sent: false,
      expires_at: expiresAt(),
      created_at: nowIso(),
    }))

    const { data, error } = await sb.from("ai_search_leads").insert(rows).select()
    if (error) throw new Error(error.message)

    // 扣除额度
    const newBalance = parseFloat((balance - COST_PER_CALL).toFixed(4))
    const newTotalUsed = parseFloat((totalUsed + COST_PER_CALL).toFixed(4))
    const newCallCount = callCount + 1
    await sb.from("ai_search_quota").update({
      balance: newBalance, total_used: newTotalUsed,
      call_count: newCallCount, updated_at: nowIso(),
    }).eq("user_id", userId)

    const remainingCalls = Math.floor(newBalance / COST_PER_CALL)
    return NextResponse.json({
      ok: true, data,
      quota: {
        balance: newBalance, totalUsed: newTotalUsed,
        callCount: newCallCount, costPerCall: COST_PER_CALL,
        remainingCalls,
        warning: remainingCalls <= 20 ? `余额预警：仅剩约 ${remainingCalls} 次可用` : null,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  try {
    const sb = await getSupabase()
    await sb.from("ai_search_leads").delete().lt("expires_at", nowIso())

    const [{ data }, { data: quotaRows }] = await Promise.all([
      sb.from("ai_search_leads").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      sb.from("ai_search_quota").select("*").eq("user_id", userId),
    ])

    const quota = quotaRows?.[0]
    const COST_PER_CALL = 0.0005
    const balance = parseFloat(quota?.balance ?? "0.1")
    const totalUsed = parseFloat(quota?.total_used ?? "0")
    const callCount = quota?.call_count ?? 0
    const remainingCalls = Math.floor(balance / COST_PER_CALL)

    return NextResponse.json({
      ok: true,
      data: data || [],
      quota: {
        balance, totalUsed, callCount,
        costPerCall: COST_PER_CALL,
        remainingCalls,
        warning: remainingCalls <= 20 ? `余额预警：仅剩约 ${remainingCalls} 次可用` : null,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  const { id } = await req.json()
  try {
    const sb = await getSupabase()
    await sb.from("ai_search_leads").delete().eq("id", id).eq("user_id", userId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  const { id, message: emailMessage, subject, toEmail } = await req.json()
  try {
    const sb = await getSupabase()
    const { data: rows } = await sb.from("ai_search_leads").select("*").eq("id", id).eq("user_id", userId)
    if (!rows?.length) return NextResponse.json({ ok: false, message: "记录不存在" }, { status: 404 })
    const lead = rows[0]
    const targetEmail = toEmail || lead.email
    if (!targetEmail) return NextResponse.json({ ok: false, message: "请填写收件邮箱" }, { status: 400 })

    await sendEmail({
      to: targetEmail,
      subject: subject || "来自 mornbusiness 的合作邀约",
      body: emailMessage || `您好！\n\n我们对您的业务非常感兴趣，希望能与您建立合作关系。\n\n期待您的回复！`,
    })

    await sb.from("ai_search_leads").update({ email_sent: true, email_sent_at: nowIso() }).eq("id", id)
    return NextResponse.json({ ok: true, message: "邮件已发送" })
  } catch (e: any) {
    console.error("[ai-search PATCH error]", e.message)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
