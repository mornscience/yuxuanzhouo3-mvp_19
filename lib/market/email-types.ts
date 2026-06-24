export interface EmailDraft {
  id: string
  userId: string
  customerId: string
  customerName: string
  customerEmail: string
  subject: string
  body: string
  status: 'draft' | 'approved' | 'sent' | 'rejected'
  aiGenerated: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EmailSend {
  id: string
  draftId: string | null
  userId: string
  fromEmail: string
  toEmail: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced'
  sendTime: Date | null
  openTime: Date | null
  clickTime: Date | null
  replyTime: Date | null
  bounceReason: string | null
  trackingPixel: string | null
  createdAt: Date
}

export interface ProxyEmail {
  id: string
  email: string
  password: string
  smtpHost: string
  smtpPort: number
  status: 'active' | 'inactive' | 'quota_exceeded'
  dailyQuota: number
  todaySent: number
  lastResetDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmailStats {
  totalSent: number
  openedCount: number
  clickedCount: number
  repliedCount: number
  bouncedCount: number
  openRate: number
  clickRate: number
  replyRate: number
}

export interface EmailGenerateRequest {
  customerId: string
  customerName: string
  customerEmail: string
  customerIndustry: string
  customerBusinessType: string
  customerProductCategories: string[]
  customerCertifications: string[]
  myProductCategories: string[]
  myCertifications: string[]
  industry: string
}

export interface EmailGenerateResponse {
  ok: boolean
  message?: string
  subject?: string
  body?: string
}

export interface EmailSendResponse {
  ok: boolean
  message?: string
  sendId?: string
}
