import nodemailer from "nodemailer"

export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const provider = process.env.EMAIL_PROVIDER || 'smtp'
  
  let host: string, port: number, user: string, pass: string, from: string
  
  switch (provider) {
    case 'qq':
      host = process.env.AUTH_EMAIL_SMTP_HOST_QQ || ''
      port = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_QQ || "587")
      user = process.env.AUTH_EMAIL_USER_QQ || ''
      pass = process.env.AUTH_EMAIL_PASSWORD_QQ || ''
      from = process.env.AUTH_EMAIL_FROM_QQ || user
      break
    case '126':
      host = process.env.AUTH_EMAIL_SMTP_HOST_126 || ''
      port = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_126 || "465")
      user = process.env.AUTH_EMAIL_USER_126 || ''
      pass = process.env.AUTH_EMAIL_PASSWORD_126 || ''
      from = process.env.AUTH_EMAIL_FROM_126 || user
      break
    case 'gmail':
      host = process.env.AUTH_EMAIL_SMTP_HOST_GMAIL || ''
      port = parseInt(process.env.AUTH_EMAIL_SMTP_PORT_GMAIL || "587")
      user = process.env.AUTH_EMAIL_USER_GMAIL || ''
      pass = process.env.AUTH_EMAIL_PASSWORD_GMAIL || ''
      from = process.env.AUTH_EMAIL_FROM_GMAIL || user
      break
    default:
      host = process.env.AUTH_EMAIL_SMTP_HOST || ''
      port = parseInt(process.env.AUTH_EMAIL_SMTP_PORT || "465")
      user = process.env.AUTH_EMAIL_USER || ''
      pass = process.env.AUTH_EMAIL_PASSWORD || ''
      from = process.env.AUTH_EMAIL_FROM || user
  }

  if (!pass) {
    console.log(`[模拟邮件发送] 到: ${to}, 主题: ${subject}`)
    console.log(`内容: ${body.substring(0, 100)}...`)
    return {
      success: true,
      message: `邮件已发送至 ${to} (模拟模式，需配置 AUTH_EMAIL_SMTP_PASS 授权码以开启真实发送)`,
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
