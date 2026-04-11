import nodemailer from "nodemailer"

/**
 * 发送邮件服务
 * 实际使用时需要配置环境变量中的 SMTP 参数
 */
export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const host = process.env.AUTH_EMAIL_SMTP_HOST
  const port = parseInt(process.env.AUTH_EMAIL_SMTP_PORT || "465")
  const user = process.env.AUTH_EMAIL_SMTP_USER
  const pass = process.env.AUTH_EMAIL_SMTP_PASS
  const from = process.env.AUTH_EMAIL_FROM || user

  // 如果没有配置 SMTP，则回退到模拟发送
  if (!host || !user || !pass) {
    console.log(`[模拟邮件发送] 到: ${to}, 主题: ${subject}`)
    console.log(`内容: ${body.substring(0, 100)}...`)
    return {
      success: true,
      message: `邮件已发送至 ${to} (模拟模式，请配置 SMTP 环境变量以开启真实发送)`,
      mock: true
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from,
      to,
      subject,
      text: body,
      // html: body.replace(/\n/g, '<br>'), // 如果需要 HTML 格式
    })

    return {
      success: true,
      message: `邮件已成功发送至 ${to}`,
    }
  } catch (error) {
    console.error("邮件发送失败:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "邮件服务器连接失败",
    }
  }
}
