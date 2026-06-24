export interface OverseasCustomer {
  id: string
  companyName: string
  companyNameEn: string
  industry: string
  subIndustry: string
  location: string
  country: string
  city: string
  contactPerson: string
  email: string
  phone: string
  website: string
  socialLinks: string[]
  businessType: 'importer' | 'distributor' | 'manufacturer' | 'retailer' | 'wholesaler' | 'agent'
  annualRevenue: string
  employeeCount: string
  foundedYear: number | null
  productCategories: string[]
  certifications: string[]
  description: string
  source: 'yellow_pages' | 'linkedin' | 'exhibition' | 'trade_portal' | 'other'
  createdAt: Date
  updatedAt: Date
}

export interface CustomerSearchParams {
  productCategories?: string[]
  industry?: string
  country?: string
  city?: string
  businessType?: string
  certifications?: string[]
  keywords?: string[]
}

export interface CustomerSearchResult {
  ok: boolean
  message?: string
  data: OverseasCustomer[]
  total: number
}

export interface CustomerMatchResult {
  customer: OverseasCustomer
  matchScore: number
  matchedCategories: string[]
  matchedCertifications: string[]
}