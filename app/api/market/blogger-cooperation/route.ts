import { NextRequest, NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { sendEmail } from "@/lib/market/send-email"
import { randomUUID } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  const type = new URL(request.url).searchParams.get("type")
  try {
    if (type === "applications") {
      // 我的申请 = 别人申请我的博主（我是博主录入者/被申请方）
      const rows = await dbAdapter.loadRows("blogger_applications", { bloggerOwnerId: userId })
      return NextResponse.json({ ok: true, data: rows })
    }
    if (type === "my_sent") {
      // 我发出的申请（我是申请方）
      const rows = await dbAdapter.loadRows("blogger_applications", { userId })
      return NextResponse.json({ ok: true, data: rows })
    }
    if (type === "cooperations") {
      // 我的合作 = 我发出的申请被同意后的合作（我是申请方）
      const rows = await dbAdapter.loadRows("blogger_cooperations", { userId })
      return NextResponse.json({ ok: true, data: rows })
    }
    if (type === "articles") {
      const rows = await dbAdapter.loadRows("article_templates", { userId })
      return NextResponse.json({ ok: true, data: rows })
    }
    if (type === "channels") {
      const rows = await dbAdapter.loadRows("publish_channels", { userId })
      return NextResponse.json({ ok: true, data: rows })
    }
    return NextResponse.json({ ok: false, message: "未知类型" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  try {
    const body = await request.json()
    const { action } = body

    // A 申请与 B 的博主合作
    // userId = A（申请方），bloggerOwnerId = B（博主录入者/被申请方）
    if (action === "apply") {
      const { bloggerId, bloggerName, platform, email, cost, commission, message, bloggerOwnerId, applicantName, applicantEmail } = body
      if (bloggerOwnerId === userId) {
        return NextResponse.json({ ok: false, message: "不能申请自己录入的博主" }, { status: 400 })
      }

      // 查询历史申请记录
      const existing = await dbAdapter.loadRows("blogger_applications", { userId, bloggerId })

      // 被拒绝过则不能再申请
      const rejected = existing.find((a: any) => (a.status === "rejected"))
      if (rejected) return NextResponse.json({ ok: false, message: "对方已拒绝您的申请，无法继续申请" }, { status: 400 })

      // 已同意则不需要再申请
      const approved = existing.find((a: any) => (a.status === "approved"))
      if (approved) return NextResponse.json({ ok: false, message: "已与该博主达成合作" }, { status: 400 })

      // 最多申请 15 次
      const MAX_APPLY = 15
      if (existing.length >= MAX_APPLY) {
        return NextResponse.json({ ok: false, message: `已达到最大申请次数（${MAX_APPLY}次）` }, { status: 400 })
      }

      await dbAdapter.insertRow("blogger_applications", {
        id: `app-${randomUUID().slice(0, 8)}`,
        userId,
        bloggerOwnerId,
        bloggerId, bloggerName, platform, email, cost, commission,
        status: "pending",
        message: message || "",
        applicantName: applicantName || "",
        applicantEmail: applicantEmail || "",
      })
      const remaining = MAX_APPLY - existing.length - 1
      return NextResponse.json({ ok: true, message: `申请已发送（剩余 ${remaining} 次机会）` })
    }

    // B 同意申请 → A 的合作列表加入这个博主
    if (action === "approve") {
      const { applicationId, articleId, channelIds } = body
      // 验证当前用户是被申请方
      const apps = await dbAdapter.loadRows("blogger_applications", { id: applicationId, bloggerOwnerId: userId })
      if (!apps.length) return NextResponse.json({ ok: false, message: "申请不存在或无权操作" }, { status: 404 })
      const app = apps[0]
      const applicantId = app.user_id || app.userId  // 申请方 id

      await dbAdapter.updateRow("blogger_applications", { id: applicationId }, { status: "approved" })

      // 在申请方（A）的合作列表里加入这个博主
      const bloggerId = app.blogger_id || app.bloggerId
      const existing = await dbAdapter.loadRows("blogger_cooperations", { userId: applicantId, bloggerId })
      let coopId = existing[0]?.id
      if (!existing.length) {
        const coop = await dbAdapter.insertRow("blogger_cooperations", {
          id: `coop-${randomUUID().slice(0, 8)}`,
          userId: applicantId,  // 合作归属于申请方 A
          bloggerId,
          bloggerName: app.blogger_name || app.bloggerName,
          platform: app.platform, email: app.email,
          cost: app.cost, commission: app.commission, status: "active",
        })
        coopId = coop.id
      }

      // 如果选了文章，发送给博主邮箱
      if (articleId) {
        const articles = await dbAdapter.loadRows("article_templates", { id: articleId })
        if (articles.length > 0) {
          const article = articles[0]
          if (app.email) {
            try {
              await sendEmail({
                to: app.email,
                subject: `合作推广文章：${article.title}`,
                body: `您好！\n\n感谢您与我们达成合作。以下是需要您推广的文章内容：\n\n标题：${article.title}\n\n${article.content}\n\n期待您的发布，谢谢！`,
              })
            } catch {}
          }
          await dbAdapter.insertRow("cooperation_publish_tasks", {
            id: `cpt-${randomUUID().slice(0, 8)}`,
            userId: applicantId, cooperationId: coopId, bloggerId,
            bloggerName: app.blogger_name || app.bloggerName,
            bloggerEmail: app.email, articleId,
            articleTitle: article.title, articleContent: article.content, status: "sent",
          })
          if (channelIds?.length) {
            for (const channelId of channelIds) {
              const chans = await dbAdapter.loadRows("publish_channels", { id: channelId })
              if (chans.length > 0) console.log(`[Publish] 发布到频道 ${chans[0].name}: ${article.title}`)
            }
          }
        }
      }
      return NextResponse.json({ ok: true, message: "已同意合作" })
    }

    if (action === "reject") {
      // 验证当前用户是被申请方
      await dbAdapter.updateRow("blogger_applications", { id: body.applicationId, bloggerOwnerId: userId }, { status: "rejected" })
      return NextResponse.json({ ok: true })
    }

    if (action === "push_article") {
      const { cooperationId, articleId, channelIds } = body
      if (!articleId) return NextResponse.json({ ok: false, message: "请选择文章" }, { status: 400 })
      const coops = await dbAdapter.loadRows("blogger_cooperations", { id: cooperationId, userId })
      if (!coops.length) return NextResponse.json({ ok: false, message: "合作记录不存在" }, { status: 404 })
      const coop = coops[0]
      const articles = await dbAdapter.loadRows("article_templates", { id: articleId })
      if (!articles.length) return NextResponse.json({ ok: false, message: "文章不存在" }, { status: 404 })
      const article = articles[0]
      const bloggerEmail = coop.email
      if (bloggerEmail) {
        try {
          await sendEmail({
            to: bloggerEmail,
            subject: `推广文章：${article.title}`,
            body: `您好！\n\n以下是需要您推广的文章内容：\n\n标题：${article.title}\n\n${article.content}\n\n期待您的发布，谢谢！`,
          })
        } catch {}
      }
      await dbAdapter.insertRow("cooperation_publish_tasks", {
        id: `cpt-${randomUUID().slice(0, 8)}`, userId,
        cooperationId, bloggerId: coop.blogger_id || coop.bloggerId,
        bloggerName: coop.blogger_name || coop.bloggerName,
        bloggerEmail: bloggerEmail, articleId,
        articleTitle: article.title, articleContent: article.content, status: "sent",
      })
      if (channelIds?.length) {
        for (const channelId of channelIds) {
          const chans = await dbAdapter.loadRows("publish_channels", { id: channelId, userId })
          if (chans.length > 0) console.log(`[Publish] 发布到频道 ${chans[0].name}: ${article.title}`)
        }
      }
      return NextResponse.json({ ok: true, message: "推广文章已发送" })
    }

    if (action === "send_message") {
      const { email, message } = body
      await sendEmail({ to: email, subject: "来自 mornbusiness 的合作消息", body: message })
      return NextResponse.json({ ok: true })
    }

    if (action === "batch_send") {
      const { cooperationIds, message } = body
      let count = 0
      for (const id of cooperationIds) {
        const rows = await dbAdapter.loadRows("blogger_cooperations", { id, userId })
        if (rows.length > 0 && rows[0].email) {
          try { await sendEmail({ to: rows[0].email, subject: "来自 mornbusiness 的合作消息", body: message }); count++ } catch {}
        }
      }
      return NextResponse.json({ ok: true, count })
    }

    return NextResponse.json({ ok: false, message: "未知操作" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
