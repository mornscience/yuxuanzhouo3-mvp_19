import { OverseasCustomer, CustomerSearchParams, CustomerMatchResult } from "./customer-types"
import { dbAdapter } from "./db-adapter"
import { getAIProvider } from "@/lib/ai/provider"
import https from 'node:https'
import dns from 'node:dns'

// Mock数据（备用）
const mockCustomers: OverseasCustomer[] = [
  {
    id: 'test_company',
    companyName: '晨佑科技测试公司',
    companyNameEn: 'MornScience Test Company',
    industry: 'Metal Products',
    subIndustry: 'Aluminum Profiles',
    location: 'Shanghai, China',
    country: 'China',
    city: 'Shanghai',
    contactPerson: 'Zhang Wei',
    email: '730357683@qq.com',
    phone: '+86-138-0000-0000',
    website: 'www.mornscience-test.com',
    socialLinks: ['linkedin.com/company/mornscience-test'],
    businessType: 'importer',
    annualRevenue: '10M-50M USD',
    employeeCount: '50-100',
    foundedYear: 2020,
    productCategories: ['Aluminum profiles', 'Aluminum doors', 'Aluminum windows'],
    certifications: ['ISO9001', 'ISO14001'],
    description: 'Test company for email sending verification. This is a metal products importer specializing in aluminum profiles.',
    source: 'test',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '1',
    companyName: 'ABC Trading Co., Ltd.',
    companyNameEn: 'ABC Trading Co., Ltd.',
    industry: 'Metal Products',
    subIndustry: 'Stainless Steel',
    location: 'Los Angeles, California, USA',
    country: 'United States',
    city: 'Los Angeles',
    contactPerson: 'John Smith',
    email: 'john.smith@abctrading.com',
    phone: '+1-213-555-0147',
    website: 'www.abctrading.com',
    socialLinks: ['linkedin.com/company/abctrading', 'twitter.com/abctrading'],
    businessType: 'importer',
    annualRevenue: '50M-100M USD',
    employeeCount: '50-100',
    foundedYear: 2005,
    productCategories: ['stainless steel pipes', 'stainless steel sheets', 'stainless steel fittings'],
    certifications: ['ISO 9001', 'ISO 14001'],
    description: 'Leading importer of stainless steel products in North America',
    source: 'yellow_pages',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: '2',
    companyName: 'Euro Metal GmbH',
    companyNameEn: 'Euro Metal GmbH',
    industry: 'Metal Products',
    subIndustry: 'Steel Products',
    location: 'Dusseldorf, Germany',
    country: 'Germany',
    city: 'Dusseldorf',
    contactPerson: 'Michael Weber',
    email: 'm.weber@eurometal.de',
    phone: '+49-211-555-0198',
    website: 'www.eurometal.de',
    socialLinks: ['linkedin.com/company/eurometalgmbh'],
    businessType: 'distributor',
    annualRevenue: '100M-500M EUR',
    employeeCount: '100-200',
    foundedYear: 1998,
    productCategories: ['steel pipes', 'steel plates', 'steel tubes'],
    certifications: ['ISO 9001', 'CE', 'DIN'],
    description: 'Major steel distributor in Europe with extensive network',
    source: 'linkedin',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-06-18')
  },
  {
    id: '3',
    companyName: 'Nippon Steel Trading Co.',
    companyNameEn: 'Nippon Steel Trading Co.',
    industry: 'Metal Products',
    subIndustry: 'Steel & Aluminum',
    location: 'Tokyo, Japan',
    country: 'Japan',
    city: 'Tokyo',
    contactPerson: 'Tanaka Hiroshi',
    email: 'hiroshi.tanaka@nipponsteel.jp',
    phone: '+81-3-5555-0123',
    website: 'www.nipponsteel-trading.jp',
    socialLinks: ['linkedin.com/company/nipponsteeltrading'],
    businessType: 'importer',
    annualRevenue: '500M-1B JPY',
    employeeCount: '200-500',
    foundedYear: 1975,
    productCategories: ['aluminum sheets', 'steel coils', 'metal fittings'],
    certifications: ['ISO 9001', 'JIS', 'ISO 14001'],
    description: 'Leading steel trading company in Japan',
    source: 'trade_portal',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-06-15')
  },
  {
    id: '4',
    companyName: 'Global Stainless Ltd.',
    companyNameEn: 'Global Stainless Ltd.',
    industry: 'Metal Products',
    subIndustry: 'Stainless Steel',
    location: 'London, United Kingdom',
    country: 'United Kingdom',
    city: 'London',
    contactPerson: 'David Brown',
    email: 'd.brown@globalstainless.co.uk',
    phone: '+44-20-7946-0156',
    website: 'www.globalstainless.co.uk',
    socialLinks: ['linkedin.com/company/globalstainless'],
    businessType: 'distributor',
    annualRevenue: '50M-100M GBP',
    employeeCount: '50-100',
    foundedYear: 2010,
    productCategories: ['stainless steel bars', 'stainless steel wire', 'stainless steel mesh'],
    certifications: ['ISO 9001', 'BS EN'],
    description: 'Specialized stainless steel distributor in UK',
    source: 'yellow_pages',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: '5',
    companyName: 'Shanghai Metal Corporation',
    companyNameEn: 'Shanghai Metal Corporation',
    industry: 'Metal Products',
    subIndustry: 'Aluminum & Copper',
    location: 'Shanghai, China',
    country: 'China',
    city: 'Shanghai',
    contactPerson: 'Li Wei',
    email: 'liwei@shanghaimetal.com',
    phone: '+86-21-5555-0188',
    website: 'www.shanghaimetal.com',
    socialLinks: ['linkedin.com/company/shanghaimetal', 'wechat.com/shanghaimetal'],
    businessType: 'manufacturer',
    annualRevenue: '1B+ CNY',
    employeeCount: '500-1000',
    foundedYear: 1995,
    productCategories: ['aluminum profiles', 'copper tubes', 'brass fittings'],
    certifications: ['ISO 9001', 'ISO 14001', 'RoHS'],
    description: 'Large metal manufacturer and exporter in China',
    source: 'exhibition',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-06-19')
  },
  {
    id: '6',
    companyName: 'Australian Metal Imports',
    companyNameEn: 'Australian Metal Imports',
    industry: 'Metal Products',
    subIndustry: 'Steel & Stainless',
    location: 'Sydney, Australia',
    country: 'Australia',
    city: 'Sydney',
    contactPerson: 'Robert Taylor',
    email: 'robert@australianmetal.com.au',
    phone: '+61-2-9555-0145',
    website: 'www.australianmetal.com.au',
    socialLinks: ['linkedin.com/company/australianmetalimports'],
    businessType: 'importer',
    annualRevenue: '20M-50M AUD',
    employeeCount: '20-50',
    foundedYear: 2015,
    productCategories: ['steel pipes', 'stainless steel sheets', 'metal roofing'],
    certifications: ['ISO 9001', 'AS/NZS'],
    description: 'Leading metal importer in Australia',
    source: 'trade_portal',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-06-20')
  },
  {
    id: '7',
    companyName: 'Nordic Steel AB',
    companyNameEn: 'Nordic Steel AB',
    industry: 'Metal Products',
    subIndustry: 'Specialty Steel',
    location: 'Stockholm, Sweden',
    country: 'Sweden',
    city: 'Stockholm',
    contactPerson: 'Anders Lindqvist',
    email: 'anders.lindqvist@nordicsteel.se',
    phone: '+46-8-5555-0134',
    website: 'www.nordicsteel.se',
    socialLinks: ['linkedin.com/company/nordicsteel'],
    businessType: 'distributor',
    annualRevenue: '50M-100M SEK',
    employeeCount: '30-50',
    foundedYear: 2002,
    productCategories: ['specialty steel', 'alloy steel', 'tool steel'],
    certifications: ['ISO 9001', 'SS-EN'],
    description: 'Specialty steel distributor in Scandinavia',
    source: 'linkedin',
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-06-17')
  },
  {
    id: '8',
    companyName: 'Middle East Metals LLC',
    companyNameEn: 'Middle East Metals LLC',
    industry: 'Metal Products',
    subIndustry: 'Steel & Aluminum',
    location: 'Dubai, UAE',
    country: 'UAE',
    city: 'Dubai',
    contactPerson: 'Ahmed Hassan',
    email: 'ahmed@me-metals.com',
    phone: '+971-4-5555-0167',
    website: 'www.me-metals.com',
    socialLinks: ['linkedin.com/company/middleeastmetals'],
    businessType: 'distributor',
    annualRevenue: '100M-500M AED',
    employeeCount: '50-100',
    foundedYear: 2008,
    productCategories: ['steel beams', 'aluminum sheets', 'copper rods'],
    certifications: ['ISO 9001', 'GCC', 'CE'],
    description: 'Major metal distributor in Middle East',
    source: 'exhibition',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-06-16')
  }
]

// 解析单个API响应
function parseApiResponse(responseText: string): any[] {
  if (!responseText || responseText.trim().length === 0) {
    console.warn("[AI Search] Empty response text")
    return []
  }
  
  let cleanResponse = responseText.trim()
  console.log("[AI Search] Raw response preview:", cleanResponse.substring(0, 200))
  
  // 移除代码块标记
  if (cleanResponse.startsWith("```json")) cleanResponse = cleanResponse.slice(7)
  else if (cleanResponse.startsWith("```")) cleanResponse = cleanResponse.slice(3)
  if (cleanResponse.endsWith("```")) cleanResponse = cleanResponse.slice(0, -3)
  cleanResponse = cleanResponse.replace(/^["']|["']$/g, '')
  
  try {
    // 首先尝试解析为对象格式 {"results": [...]}
    const parsed = JSON.parse(cleanResponse)
    
    // 如果是对象且包含results字段
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.results)) {
      console.log("[AI Search] Parsed as object with results array:", parsed.results.length)
      return parsed.results
    }
    
    // 如果是数组直接返回
    if (Array.isArray(parsed)) {
      console.log("[AI Search] Parsed as array:", parsed.length)
      return parsed
    }
    
    console.warn("[AI Search] Unexpected response structure")
    return []
    
  } catch (e) {
    console.warn("[AI Search] JSON parse error:", e)
    
    // 尝试查找数组并解析
    const firstBracketIndex = cleanResponse.indexOf('[')
    const lastBracketIndex = cleanResponse.lastIndexOf(']')
    
    if (firstBracketIndex !== -1 && lastBracketIndex !== -1) {
      try {
        const arrayStr = cleanResponse.substring(firstBracketIndex, lastBracketIndex + 1)
        const results = JSON.parse(arrayStr)
        if (Array.isArray(results)) {
          console.log("[AI Search] Extracted array from response:", results.length)
          return results
        }
      } catch (e2) {
        console.warn("[AI Search] Failed to extract array:", e2)
      }
    }
    
    return []
  }
}

// 验证数据是否真实（加强假数据过滤）
function isValidCustomer(item: any): boolean {
  // 必须有公司名称
  const companyName = item.companyName || item.company_name || item.name || ''
  if (!companyName.trim()) return false
  
  // 过滤明显的测试数据
  const isFakePattern = companyName.toLowerCase().includes('test') || 
                       companyName.toLowerCase().includes('mock') ||
                       companyName.toLowerCase().includes('example') ||
                       item.email?.includes('example.com') ||
                       item.phone?.startsWith('+1-000')
  
  if (isFakePattern) return false
  
  // 过滤假电话号码（顺序数字模式）
  const phone = (item.phone || '').replace(/[\s\-\+]/g, '')
  const fakePhonePatterns = [
    /12345678/, /1234567/, /123456/,
    /2244444/, /8239999/, /5556666/,
    /2233221/, /2244444/, /3998888/,
    /1111111/, /2222222/, /3333333/,
    /4444444/, /5555555/, /6666666/,
    /7777777/, /8888888/, /9999999/,
    /0000000/,
    /555019/,  // 美国测试号码段 +1-XXX-555-019X
    /555018/,
    /555017/,
    /555016/,
    /555015/,
  ]
  
  for (const pattern of fakePhonePatterns) {
    if (pattern.test(phone)) {
      console.log("[AI Search] Filtered fake phone:", item.phone, "for company:", companyName)
      return false
    }
  }
  
  // 过滤假地址（通用模板地址）
  const location = item.location || ''
  const fakeAddressPatterns = [
    /123\s+high\s+street/i,
    /456\s+business\s+park/i,
    /unit\s+[0-9]+,\s*industrial\s+park/i,
    /123\s+main\s+st/i,
    /456\s+oak\s+avenue/i,
    /789\s+elm\s+street/i,
    /^123\s+/i,     // 门牌号123开头
    /^456\s+/i,     // 门牌号456开头
    /^789\s+/i,     // 门牌号789开头
    /^101\s+/i,     // 门牌号101开头
    /acoustic\s+lane/i,    // 刻意的街道名
    /sound\s+street/i,     // 刻意的街道名
    /echo\s+drive/i,       // 刻意的街道名
    /acoustic\s+way/i,     // 刻意的街道名
  ]
  
  for (const pattern of fakeAddressPatterns) {
    if (pattern.test(location)) {
      console.log("[AI Search] Filtered fake address:", location, "for company:", companyName)
      return false
    }
  }
  
  // 定义有效域名后缀列表
  const validTLDs = ['.com', '.net', '.org', '.edu', '.gov', '.io', '.co', '.biz', '.info', 
                     '.us', '.uk', '.jp', '.de', '.fr', '.cn', '.au', '.ca', '.sg', '.ae',
                     '.co.jp', '.co.uk', '.com.cn', '.ne.jp']
  
  // 验证网站必须有有效域名（必须有网站）
  const website = item.website || ''
  if (!website || !website.startsWith('http')) {
    console.log("[AI Search] Filtered invalid website:", website, "for company:", companyName)
    return false
  }
  
  // 检查网站域名是否有效
  const websiteDomain = website.replace(/^https?:\/\//, '').split('/')[0]
  const websiteHasValidTLD = validTLDs.some(tld => websiteDomain.endsWith(tld))
  if (!websiteHasValidTLD) {
    console.log("[AI Search] Filtered invalid website domain:", websiteDomain, "for company:", companyName)
    return false
  }
  
  // 验证联系方式：至少有邮箱或电话之一（不再要求两者都有）
  const email = item.email || ''
  const rawPhone = item.phone || ''
  
  const hasValidEmail = email.includes('@') && email.includes('.') && 
                       validTLDs.some(tld => email.split('@')[1]?.endsWith(tld))
  const hasValidPhone = rawPhone.length >= 8 && /^[\d\s\-\+()]+$/.test(rawPhone)
  
  if (!hasValidEmail && !hasValidPhone) {
    console.log("[AI Search] Filtered missing contact info - email:", email, "phone:", rawPhone, "for company:", companyName)
    return false
  }
  
  return true
}

// 验证客户数据是否与搜索条件匹配
function isCustomerMatched(item: any, params: CustomerSearchParams): boolean {
  // 国家匹配检查
  if (params.country && params.country.toLowerCase() !== 'all' && params.country.toLowerCase() !== 'global') {
    const itemCountry = (item.country || '').toLowerCase().trim()
    const searchCountry = params.country.toLowerCase().trim()
    
    if (!itemCountry.includes(searchCountry) && !searchCountry.includes(itemCountry)) {
      console.log("[AI Search] Country mismatch:", itemCountry, "vs", searchCountry, "for company:", item.companyName)
      return false
    }
  }
  
  // 行业匹配检查
  if (params.industry && params.industry.toLowerCase() !== 'all') {
    const itemIndustry = (item.industry || '').toLowerCase()
    const itemDescription = (item.description || '').toLowerCase()
    const itemCategories = (item.productCategories || []).join(' ').toLowerCase()
    const searchIndustry = params.industry.toLowerCase()
    
    const hasIndustryMatch = itemIndustry.includes(searchIndustry) || 
                            itemDescription.includes(searchIndustry) ||
                            itemCategories.includes(searchIndustry)
    
    if (!hasIndustryMatch) {
      console.log("[AI Search] Industry mismatch:", itemIndustry, "vs", searchIndustry, "for company:", item.companyName)
      return false
    }
  }
  
  return true
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 判断是否选择了具体条件（非"全部"）
function hasSpecificFilter(params: CustomerSearchParams): boolean {
  // 检查国家是否为特定值（非all/global）
  const hasCountryFilter = params.country && 
    params.country.toLowerCase() !== 'all' && 
    params.country.toLowerCase() !== 'global'
  
  // 检查业务类型是否为特定值（非空/all）
  const hasBusinessTypeFilter = params.businessType && 
    params.businessType.toLowerCase() !== 'all'
  
  return hasCountryFilter || hasBusinessTypeFilter
}

// 中文行业术语到英文的映射
const chineseIndustryMap: Record<string, string> = {
  '建筑声学装饰': 'architectural acoustic decoration',
  '建筑装饰': 'architectural decoration',
  '金属制品': 'metal products',
  '塑料制品': 'plastic products',
  '机械设备': 'machinery equipment',
  '建材': 'building materials',
  '五金': 'hardware',
  '化工': 'chemical industry',
  '电子': 'electronics',
  '纺织': 'textile',
  '食品': 'food',
  '医疗': 'medical',
  '汽车': 'automotive',
  '能源': 'energy',
  '环保': 'environmental protection'
}

// 将中文行业术语转换为英文
function translateIndustryToEnglish(chineseIndustry: string): string {
  if (!chineseIndustry) return 'business'
  
  if (chineseIndustryMap[chineseIndustry]) {
    return chineseIndustryMap[chineseIndustry]
  }
  
  for (const [chinese, english] of Object.entries(chineseIndustryMap)) {
    if (chineseIndustry.includes(chinese)) {
      return english
    }
  }
  
  return 'business'
}

function isProductsRelevantToIndustry(productKeywords: string, industryKeyword: string): boolean {
  const productLower = productKeywords.toLowerCase()
  const industryLower = industryKeyword.toLowerCase()
  
  const industryProductMap: Record<string, string[]> = {
    'architectural acoustic': ['acoustic', 'sound', 'noise', 'insulation', 'absorption', 'panel', 'foam', 'board', 'felt'],
    'construction': ['steel', 'pipe', 'concrete', 'cement', 'brick', 'building', 'material', 'glass', 'aluminum'],
    'automotive': ['auto', 'car', 'vehicle', 'parts', 'component'],
    'electronics': ['electronic', 'circuit', 'chip', 'component', 'device'],
    'food': ['food', 'beverage', 'grain', 'snack', 'drink'],
    'textile': ['fabric', 'textile', 'clothing', 'garment', 'fiber'],
    'chemical': ['chemical', 'plastic', 'polymer', 'resin', 'paint'],
    'medical': ['medical', 'pharmaceutical', 'healthcare', 'hospital', 'equipment'],
    'energy': ['energy', 'power', 'solar', 'wind', 'battery'],
    'machinery': ['machine', 'equipment', 'tool', 'industrial', 'engine'],
    'furniture': ['furniture', 'wood', 'chair', 'table', 'sofa'],
    'paper': ['paper', 'packaging', 'printing', 'cardboard'],
    'rubber': ['rubber', 'tire', 'latex', 'seal'],
    'ceramic': ['ceramic', 'tile', 'pottery', 'porcelain'],
    'leather': ['leather', 'bag', 'shoe', 'wallet'],
    'metal': ['metal', 'steel', 'iron', 'aluminum', 'copper'],
    'plastics': ['plastic', 'polymer', 'resin', 'pipe', 'container'],
    'glass': ['glass', 'window', 'bottle', 'mirror'],
    'stone': ['stone', 'marble', 'granite', 'tile'],
    'wood': ['wood', 'timber', 'lumber', 'furniture'],
  }
  
  for (const [industry, relevantWords] of Object.entries(industryProductMap)) {
    if (industryLower.includes(industry) || industry.includes(industryLower)) {
      for (const word of relevantWords) {
        if (productLower.includes(word)) {
          return true
        }
      }
      return false
    }
  }
  
  return true
}

// 使用 Tavily Search API 获取海外企业网页内容
async function searchWithTavily(params: CustomerSearchParams): Promise<any[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.warn("[AI Search] Tavily API key not configured")
    return []
  }
  
  const targetCountry = params.country || 'global'
  const businessType = params.businessType || 'importer'
  
  // 将中文行业术语转换为英文，便于海外搜索
  const industryKeyword = translateIndustryToEnglish(params.industry) || 'construction'
  
  // 构建搜索查询：行业作为主体，产品作为补充
  // 搜索词不能太长，否则Tavily返回0结果
  const MAX_PRODUCT_KEYWORDS = 3
  const productCategories = params.productCategories || []
  
  // 只取前几个核心产品关键词，避免搜索词过长
  const topProductKeywords = productCategories.slice(0, MAX_PRODUCT_KEYWORDS).join(' ')
  
  let query = `${businessType} ${industryKeyword}`
  
  // 如果产品类别与行业相关，添加少量核心产品词
  if (topProductKeywords && isProductsRelevantToIndustry(topProductKeywords, industryKeyword)) {
    query += ` ${topProductKeywords}`
  }
  
  query += ` companies in ${targetCountry}`
  console.log("[AI Search] Tavily search query:", query)
  
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        search_depth: "advanced",
        max_results: 8,
        include_answer: false,
        include_raw_content: true,
        include_images: false
      })
    })
    
    const data = await response.json()
    console.log("[AI Search] Tavily search results count:", data.results?.length || 0)
    
    if (!data.results || !Array.isArray(data.results)) {
      return []
    }
    
    return data.results
  } catch (error) {
    console.error("[AI Search] Tavily search failed:", error)
    return []
  }
}

async function verifyEmailDomain(email: string): Promise<boolean> {
  return new Promise((resolve) => {
    const domain = email.split('@')[1]
    if (!domain) {
      resolve(false)
      return
    }
    
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        console.log(`[AI Search] Email domain ${domain} has no MX records`)
        resolve(false)
      } else {
        console.log(`[AI Search] Email domain ${domain} has MX records: ${addresses.map(a => a.exchange).join(', ')}`)
        resolve(true)
      }
    })
  })
}

async function searchCompanyEmail(companyName: string, companyWebsite: string = ''): Promise<{ email: string; verified: boolean } | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    return null
  }
  
  let websiteDomain = ''
  if (companyWebsite) {
    try {
      const url = new URL(companyWebsite)
      websiteDomain = url.hostname.toLowerCase().replace('www.', '')
    } catch {
      websiteDomain = companyWebsite.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
    }
    console.log(`[AI Search] Company website domain: ${websiteDomain}`)
  }
  
  const dataPlatformDomains = [
    'seair.co.in', 'importgenius.com', 'panjiva.com', 'zoominfo.com',
    'dnb.com', 'experian.com', 'lexisnexis.com', 'businessforsale.com',
    'alibaba.com', 'made-in-china.com', 'globalsources.com', 'tradeindia.com',
    'indiamart.com', 'exportgenius.in', 'infodriveindia.com', 'trademap.org',
    'oec.world', 'comtrade.un.org', 'econdb.com', 'statista.com'
  ]
  
  if (websiteDomain && dataPlatformDomains.some(domain => websiteDomain === domain || websiteDomain.endsWith('.' + domain))) {
    console.log(`[AI Search] Skipping email search - website is data platform: ${websiteDomain}`)
    return null
  }
  
  const templatePlaceholders = [
    /^f\.last$/, /^first\.last$/, /^firstlast$/, /^first_last$/,
    /^j\.doe$/, /^john\.doe$/, /^johndoe$/, /^john_doe$/,
    /^jane\.doe$/, /^janedoe$/, /^jane_doe$/,
    /^jdoe$/, /^flast$/, /^last$/, /^first$/,
    /^yourname$/, /^your\.name$/, /^youremail$/, /^email$/,
    /^name$/, /^fullname$/, /^username$/, /^user$/,
    /^guest$/, /^test$/, /^demo$/, /^example$/,
    /^noreply$/, /^donotreply$/, /^no\.reply$/
  ]
  
  const queries = websiteDomain 
    ? [
        `${companyName} contact email site:${websiteDomain}`,
        `${companyName} info email site:${websiteDomain}`,
        `${companyName} sales email site:${websiteDomain}`,
        `${companyName} business email site:${websiteDomain}`
      ]
    : [
        `${companyName} official contact email`,
        `${companyName} info email address`,
        `${companyName} sales email contact`,
        `${companyName} business email address`
      ]
  
  const validateEmail = (email: string): boolean => {
    const emailLocal = email.split('@')[0]?.toLowerCase() || ''
    const emailDomain = email.split('@')[1]?.toLowerCase() || ''
    
    const isTemplate = templatePlaceholders.some(pattern => emailLocal.match(pattern))
    if (isTemplate) {
      console.log(`[AI Search] Skipping template email: ${email}`)
      return false
    }
    
    if (emailLocal.length < 3 || emailLocal.length > 64) {
      return false
    }
    
    if (!websiteDomain) return true
    
    if (emailDomain === websiteDomain || emailDomain.endsWith('.' + websiteDomain)) {
      return true
    }
    
    const companyLower = companyName.toLowerCase().replace(/\s+/g, '')
    if (emailDomain.includes(companyLower) || websiteDomain.includes(emailDomain.split('.')[0])) {
      return true
    }
    
    return false
  }
  
  for (const query of queries) {
    try {
      console.log(`[AI Search] Searching email with query: ${query}`)
      
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query,
          search_depth: "advanced",
          max_results: 5,
          include_answer: false,
          include_raw_content: true,
          include_images: false
        })
      })
      
      const data = await response.json()
      if (!data.results || !Array.isArray(data.results)) {
        continue
      }
        
        for (const result of data.results) {
          const content = result.raw_content || result.content || result.snippet || ''
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
          const emails = content.match(emailPattern) || []
          
          for (const email of emails) {
            if (validateEmail(email)) {
              const hasMxRecords = await verifyEmailDomain(email)
              console.log(`[AI Search] Found email ${email} for ${companyName}, MX verified: ${hasMxRecords}`)
              return { email, verified: hasMxRecords }
            }
          }
        }
      } catch (error) {
        console.error(`[AI Search] Email search failed for ${companyName}:`, error)
      }
  }
  
  if (companyWebsite) {
    const contactPaths = ['/contact', '/contact-us', '/about', '/about-us', '/contact.html', '/about.html', '/info']
    for (const path of contactPaths) {
      try {
        const contactUrl = companyWebsite.replace(/\/$/, '') + path
        console.log(`[AI Search] Checking contact page: ${contactUrl}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        
        const response = await fetch(contactUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MornHub/1.0)'
          }
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const content = await response.text()
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
          const emails = content.match(emailPattern) || []
          
          for (const email of emails) {
            if (validateEmail(email)) {
              const hasMxRecords = await verifyEmailDomain(email)
              console.log(`[AI Search] Found email ${email} for ${companyName} from contact page, MX verified: ${hasMxRecords}`)
              return { email, verified: hasMxRecords }
            }
          }
        }
      } catch (error) {
        console.log(`[AI Search] Contact page ${path} not accessible for ${companyName}`)
      }
    }
  }
  
  console.log(`[AI Search] No email found for ${companyName}`)
  return null
}

// 使用 LLM 模型从网页内容中提取结构化企业数据
// 优先级：Replicate > Groq > Together AI > OpenRouter (qwen-turbo 已停用)
async function extractWithGroq(webResults: any[], params: CustomerSearchParams): Promise<OverseasCustomer[]> {
  const togetherApiKey = process.env.TOGETHER_API_KEY
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  const aliyunApiKey = process.env.ALIYUN_DASHSCOPE_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY
  
  console.log("[AI Search] TOGETHER_API_KEY loaded:", togetherApiKey ? togetherApiKey.substring(0, 6) + "..." : "NOT SET")
  console.log("[AI Search] OPENROUTER_API_KEY loaded:", openrouterApiKey ? openrouterApiKey.substring(0, 6) + "..." : "NOT SET")
  console.log("[AI Search] ALIYUN_API_KEY loaded:", aliyunApiKey ? aliyunApiKey.substring(0, 6) + "..." : "NOT SET")
  console.log("[AI Search] GROQ_API_KEY loaded:", groqApiKey ? groqApiKey.substring(0, 6) + "..." : "NOT SET")
  
  if (!togetherApiKey && !openrouterApiKey && !aliyunApiKey && !groqApiKey) {
    console.warn("[AI Search] No LLM API key configured")
    return []
  }
  
  if (!webResults || webResults.length === 0) {
    return []
  }
  
  const targetCountry = params.country || 'global'
  
  const maxSourceCount = 4
  const maxContentLength = 3000
  const limitedResults = webResults.slice(0, maxSourceCount)
  
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const companyEmailMap: Map<string, string> = new Map()
  
  for (const result of limitedResults) {
    const content = (result.raw_content || result.content || result.snippet || '').substring(0, maxContentLength)
    const emails = content.match(emailPattern) || []
    
    const companyNamePattern = /(?:company|corporation|inc\.?|llc|ltd\.?|limited|group|co\.)\s*[A-Z][a-zA-Z0-9\s&-]+(?:company|corporation|inc\.?|llc|ltd\.?|limited|group|co\.)?/gi
    const companyNames = content.match(companyNamePattern) || []
    
    for (const email of emails) {
      const emailLower = email.toLowerCase()
      if (emailLower.includes('@gmail.com') || emailLower.includes('@yahoo.com') || 
          emailLower.includes('@hotmail.com') || emailLower.includes('@outlook.com')) {
        continue
      }
      
      const emailDomain = email.split('@')[1]?.toLowerCase() || ''
      if (!emailDomain || emailDomain.length < 3) continue
      
      let matched = false
      for (const companyName of companyNames) {
        const cleanCompanyName = companyName.toLowerCase().replace(/\s+/g, '')
        const emailLocal = email.split('@')[0]?.toLowerCase() || ''
        
        if (emailDomain.includes(cleanCompanyName.substring(0, 10)) ||
            cleanCompanyName.includes(emailDomain.split('.')[0]) ||
            emailLocal.includes(cleanCompanyName.substring(0, 8))) {
          companyEmailMap.set(companyName.trim(), email)
          matched = true
          break
        }
      }
      
      if (!matched) {
        const words = content.toLowerCase().split(/[\s,.()<>]/)
        for (const word of words) {
          if (word.length >= 4 && emailDomain.includes(word)) {
            companyEmailMap.set(word, email)
            break
          }
        }
      }
    }
  }
  
  console.log(`[AI Search] Extracted ${companyEmailMap.size} email(s) from raw content`)
  
  const context = limitedResults.map((result, index) => {
    const content = (result.raw_content || result.content || result.snippet || '').substring(0, maxContentLength)
    return `[SOURCE ${index + 1}]
URL: ${result.url}
Title: ${result.title}
Content: ${content}
`
  }).join('\n')
  
  console.log("[AI Search] Context length:", context.length, "sources:", limitedResults.length)
  
  const systemMessage = "CRITICAL INSTRUCTIONS: You are a STRICT information extractor. ONLY extract data that EXPLICITLY appears in the provided web page content. UNDER NO CIRCUMSTANCES should you invent, guess, or fabricate any information including company names, emails, phone numbers, addresses, or any other details. If a piece of information is not clearly visible in the source content, LEAVE IT EMPTY. Return ONLY valid JSON array format. No preamble, no explanation, just the JSON."
  
  const targetBusinessType = params.businessType || 'importer'
  const userMessage = `Extract company information from the web page content below. RULES:
1. ONLY extract data that is EXPLICITLY shown in the source content
2. NEVER invent, guess, or fabricate ANY information
3. IMPORTANT: The website field MUST be the company's OWN official website URL, NOT a data aggregator, directory, or trade platform URL.
4. DO NOT use URLs from these data platforms: seair.co.in, importgenius.com, panjiva.com, zoominfo.com, dnb.com, businessforsale.com, alibaba.com, made-in-china.com
5. CRITICAL: NEVER fabricate or invent website URLs. ONLY include a website URL if it is EXPLICITLY shown in the source content. If no official website is found in the content, leave website field completely empty.
6. CRITICAL: ONLY extract companies whose business type matches: ${targetBusinessType}. Companies that are manufacturers, factories, or producers should NOT be extracted unless they also clearly identify as ${targetBusinessType}.
7. CRITICAL: ONLY extract companies that are CLEARLY LOCATED in ${targetCountry}. Check for country indicators like: Japanese address, .jp domain website, Japanese phone number (+81), or explicit mention of operations in ${targetCountry}. If a company is not clearly in ${targetCountry}, EXCLUDE it.
8. Look for keywords indicating ${targetBusinessType}: import, importation, distributor, wholesale, trading company, supply, procurement, sourcing agent

Extract these fields for each valid company:
- companyName
- companyNameEn
- industry
- location
- country
- city
- contactPerson (only if explicitly mentioned)
- email (only if explicitly shown in content, leave empty if not found)
- phone (only if explicitly mentioned)
- website (MUST be company's OWN official website, NOT data platform URL)
- businessType (must be ${targetBusinessType} if mentioned, otherwise leave empty)
- productCategories (array - only categories explicitly mentioned)
- certifications (array - only if explicitly mentioned)
- description (only text from source)

Web Page Content:\n${context}\n\nReturn ONLY a JSON array. Example format: [{"id":"1","companyName":"ABC Corp","companyNameEn":"ABC Corporation","industry":"Trading","location":"123 Main St, Tokyo","country":"Japan","city":"Tokyo","contactPerson":"","email":"","phone":"","website":"https://www.abccorp.com","businessType":"importer","productCategories":["steel pipes"],"certifications":[],"description":"Import and distribute steel pipes"}]`
  
  async function callLLM(hostname: string, path: string, apiKey: string, model: string, extraHeaders: any = {}): Promise<any> {
    const requestBody = JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ],
      temperature: 0.05,
      max_tokens: 8192
    })
    
    console.log(`[AI Search] Calling ${hostname} - model: ${model}`)
    console.log("[AI Search] Request body size:", requestBody.length)
    
    return new Promise<any>((resolve, reject) => {
      const options = {
        hostname: hostname,
        path: path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          ...extraHeaders
        }
      }
      
      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          console.log(`[AI Search] ${hostname} response status:`, res.statusCode)
          try {
            const parsed = JSON.parse(body)
            resolve({ status: res.statusCode, data: parsed })
          } catch (e) {
            reject(new Error(`JSON parse error: ${e}`))
          }
        })
      })
      
      req.on('error', (e) => reject(e))
      req.write(requestBody)
      req.end()
    })
  }
  
  async function callReplicate(apiKey: string, model: string): Promise<string> {
    const prompt = `<|begin_of_sorted|><system>${systemMessage}</system><user>${userMessage}</user><|end_of_sorted|>`
    
    const requestBody = JSON.stringify({
      input: {
        prompt: prompt,
        max_tokens: 8192,
        temperature: 0.05,
        stop: ["<|end_of_sorted|>"]
      },
      stream: false
    })
    
    console.log(`[AI Search] Calling Replicate - model: ${model}`)
    console.log("[AI Search] Request body size:", requestBody.length)
    
    const createResponse = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: 'api.replicate.com',
        path: `/v1/models/${model}/predictions`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }
      
      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          console.log('[AI Search] Replicate create prediction status:', res.statusCode)
          try {
            const parsed = JSON.parse(body)
            if (res.statusCode === 201) {
              resolve(parsed)
            } else {
              reject(new Error(`Replicate API error: ${parsed.detail || body}`))
            }
          } catch (e) {
            reject(new Error(`JSON parse error: ${e}`))
          }
        })
      })
      
      req.on('error', (e) => reject(e))
      req.write(requestBody)
      req.end()
    })
    
    const predictionId = createResponse.id
    console.log(`[AI Search] Replicate prediction created: ${predictionId}`)
    
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const result = await new Promise<any>((resolve, reject) => {
        const options = {
          hostname: 'api.replicate.com',
          path: `/v1/predictions/${predictionId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        }
        
        const req = https.request(options, (res) => {
          let body = ''
          res.on('data', (chunk) => { body += chunk })
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body)
              resolve(parsed)
            } catch (e) {
              reject(new Error(`JSON parse error: ${e}`))
            }
          })
        })
        
        req.on('error', (e) => reject(e))
        req.end()
      })
      
      if (result.status === 'succeeded') {
        const output = result.output
        if (Array.isArray(output)) {
          return output.join('\n')
        }
        return String(output)
      }
      
      if (result.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${result.error || 'unknown error'}`)
      }
      
      console.log(`[AI Search] Replicate status: ${result.status}, polling...`)
    }
    
    throw new Error('Replicate prediction timeout')
  }
  
  let data: any
  let provider = ''
  const replicateApiKey = process.env.REPLICATE_API_KEY
  
  if (replicateApiKey) {
    try {
      provider = 'Replicate'
      console.log('[AI Search] Calling Replicate API...')
      const replicateModel = process.env.REPLICATE_MODEL || 'meta/meta-llama-3-70b-instruct'
      const replicateResult = await callReplicate(replicateApiKey, replicateModel)
      
      if (replicateResult) {
        data = { choices: [{ message: { content: replicateResult } }] }
        console.log(`[AI Search] Replicate succeeded! Response length:`, replicateResult.length)
      }
    } catch (error) {
      console.error(`[AI Search] Replicate failed:`, error)
    }
  }
  
  if (!data) {
    if (groqApiKey) {
      try {
        provider = 'Groq'
        console.log('[AI Search] Calling Groq with fetch()...')
        const groqRequestBody = JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          temperature: 0.05,
          max_tokens: 8192
        })
        
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: groqRequestBody
        })
        
        console.log('[AI Search] Groq fetch response status:', groqResponse.status)
        if (groqResponse.ok) {
          data = await groqResponse.json()
          console.log(`[AI Search] Groq succeeded! Response length:`, JSON.stringify(data).length)
        } else {
          const errorBody = await groqResponse.text()
          console.error(`[AI Search] Groq HTTP error: ${groqResponse.status} - ${errorBody}`)
        }
      } catch (error) {
        console.error(`[AI Search] Groq fetch failed:`, error)
      }
    }
  }
  
  if (!data) {
    const providers = []
    if (togetherApiKey) providers.push({ name: 'Together', hostname: 'api.together.ai', path: '/v1/chat/completions', apiKey: togetherApiKey, model: process.env.TOGETHER_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo' })
    if (openrouterApiKey) providers.push({ name: 'OpenRouter', hostname: 'openrouter.ai', path: '/api/v1/chat/completions', apiKey: openrouterApiKey, model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct', headers: { 'HTTP-Referer': 'https://localhost:3000' } })
    if (aliyunApiKey) providers.push({ name: 'Aliyun', hostname: 'dashscope.aliyuncs.com', path: '/compatible-mode/v1/chat/completions', apiKey: aliyunApiKey, model: 'qwen-turbo' })
    
    for (const p of providers) {
      try {
        provider = p.name
        const result = await callLLM(p.hostname, p.path, p.apiKey, p.model, p.headers || {})
        data = result.data
        console.log(`[AI Search] ${provider} response received:`, JSON.stringify(data, null, 2).substring(0, 1000))
        
        if (result.status === 200 && !data.error) {
          console.log(`[AI Search] ${provider} succeeded!`)
          break
        }
        
        console.error(`[AI Search] ${provider} API error:`, data?.error?.message)
        
      } catch (error) {
        console.error(`[AI Search] ${provider} failed:`, error)
      }
      
      if (p.name !== providers[providers.length - 1].name) {
        console.log(`[AI Search] Falling back to next provider...`)
      }
    }
  }
  
  if (!data) {
    console.error("[AI Search] All LLM providers failed")
    return []
  }
  
  if (data.error) {
    console.error("[AI Search] LLM API error:", data.error.message)
    return []
  }
  
  if (!data.choices || data.choices.length === 0) {
    console.warn("[AI Search] LLM returned empty choices")
    return []
  }
  
  const responseText = data.choices[0].message?.content?.trim() || ''
  console.log("[AI Search] LLM response length:", responseText.length)
  
  if (!responseText) {
    console.warn("[AI Search] LLM returned empty content")
    return []
  }
  
  let cleanResponse = responseText
  if (cleanResponse.startsWith("```json")) cleanResponse = cleanResponse.slice(7)
  if (cleanResponse.endsWith("```")) cleanResponse = cleanResponse.slice(0, -3)
  
  const firstBracket = cleanResponse.indexOf('[')
  const lastBracket = cleanResponse.lastIndexOf(']')
  
  if (firstBracket === -1 || lastBracket === -1) {
    console.warn("[AI Search] LLM response format error - no brackets found")
    console.warn("[AI Search] Raw response:", cleanResponse.substring(0, 500))
    return []
  }
  
  cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1)
  console.log("[AI Search] Cleaned response:", cleanResponse.substring(0, 500))
  
  let results
  try {
    results = JSON.parse(cleanResponse)
  } catch (parseError) {
    console.error("[AI Search] LLM JSON parse error:", parseError)
    return []
  }
  
  if (!Array.isArray(results)) {
    console.warn("[AI Search] LLM response is not an array")
    return []
  }
  
  console.log("[AI Search] LLM extracted companies:", results.length)
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  const companiesWithEmail: any[] = []
  const companiesWithoutEmail: any[] = []
  
  for (const item of results) {
    const email = item.email || ''
    if (email && emailRegex.test(email)) {
      companiesWithEmail.push(item)
    } else {
      companiesWithoutEmail.push(item)
    }
  }
  
  console.log(`[AI Search] Companies with email: ${companiesWithEmail.length}, without email: ${companiesWithoutEmail.length}`)
  
  const companiesWithVerifiedEmail: any[] = []
  
  for (const item of companiesWithEmail) {
    const email = item.email || ''
    const emailFoundInSource = limitedResults.some((source) => {
      const content = source.raw_content || source.content || source.snippet || ''
      return content.toLowerCase().includes(email.toLowerCase())
    })
    
    if (emailFoundInSource) {
      companiesWithVerifiedEmail.push(item)
    } else {
      console.log(`[AI Search] Filtered out: email ${email} not found in source content`)
    }
  }
  
  console.log(`[AI Search] Companies with verified email from source: ${companiesWithVerifiedEmail.length}`)
  
  if (companiesWithoutEmail.length > 0) {
    console.log(`[AI Search] Searching email for ${companiesWithoutEmail.length} companies...`)
    
    const dataPlatformDomains = [
      'seair.co.in', 'importgenius.com', 'panjiva.com', 'zoominfo.com',
      'dnb.com', 'experian.com', 'lexisnexis.com', 'businessforsale.com',
      'alibaba.com', 'made-in-china.com', 'globalsources.com', 'tradeindia.com'
    ]
    
    let emailSearchCount = 0
    const maxEmailSearches = 5
    
    for (const company of companiesWithoutEmail) {
      const companyName = company.companyNameEn || company.companyName
      if (!companyName) continue
      
      let cleanWebsite = company.website || ''
      if (cleanWebsite) {
        try {
          const url = new URL(cleanWebsite)
          const domain = url.hostname.toLowerCase().replace('www.', '')
          if (dataPlatformDomains.some(d => domain === d || domain.endsWith('.' + d))) {
            cleanWebsite = ''
            console.log(`[AI Search] Removed data platform URL for ${companyName}`)
          }
        } catch {
          cleanWebsite = ''
        }
      }
      company.website = cleanWebsite
      
      let foundEmail = false
      const companyNameLower = companyName.toLowerCase().replace(/\s+/g, '')
      
      for (const [key, email] of companyEmailMap) {
        const keyLower = key.toLowerCase().replace(/\s+/g, '')
        if (companyNameLower.includes(keyLower.substring(0, Math.min(keyLower.length, 8))) ||
            keyLower.includes(companyNameLower.substring(0, Math.min(companyNameLower.length, 8)))) {
          const emailDomain = email.split('@')[1]?.toLowerCase() || ''
          const foundInSource = limitedResults.some((source) => {
            const content = source.raw_content || source.content || source.snippet || ''
            return content.toLowerCase().includes(email.toLowerCase())
          })
          
          if (foundInSource) {
            console.log(`[AI Search] Found email from raw content for ${companyName}: ${email}`)
            company.email = email
            company.emailVerification = 'verified'
            foundEmail = true
            break
          }
        }
      }
      
      if (!foundEmail && emailSearchCount < maxEmailSearches) {
        const emailResult = await searchCompanyEmail(companyName, cleanWebsite)
        emailSearchCount++
        if (emailResult) {
          console.log(`[AI Search] Found email for ${companyName}: ${emailResult.email}, MX verified: ${emailResult.verified}`)
          company.email = emailResult.email
          company.emailVerification = emailResult.verified ? 'verified' : 'pending'
        } else {
          console.log(`[AI Search] No email found for ${companyName}, keeping company with website`)
          company.email = ''
          company.emailVerification = 'pending'
        }
      } else if (!foundEmail) {
        console.log(`[AI Search] Skipping email search for ${companyName} (limit reached)`)
        company.email = ''
        company.emailVerification = 'pending'
      }
      companiesWithVerifiedEmail.push(company)
    }
  }
  
  console.log("[AI Search] Total companies found:", companiesWithVerifiedEmail.length)
  
  return companiesWithVerifiedEmail.map((item: any, index: number) => ({
    id: item.id || `llm_${Date.now()}_${index}`,
    companyName: item.companyName || item.name || '',
    companyNameEn: item.companyNameEn || item.companyName || '',
    industry: item.industry || '',
    subIndustry: item.subIndustry || '',
    location: item.location || '',
    country: item.country || targetCountry,
    city: item.city || '',
    contactPerson: item.contactPerson || '',
    email: item.email || '',
    phone: item.phone || '',
    website: item.website || '',
    socialLinks: [],
    businessType: item.businessType || '',
    productCategories: item.productCategories || [],
    certifications: item.certifications || [],
    description: item.description || '',
    source: 'ai_web_search',
    sourceUrl: item.website || '',
    emailVerification: item.emailVerification || 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }))
}

// 清洗和验证网站URL
function cleanAndValidateWebsite(website: string): string {
  if (!website) return ''
  
  let cleaned = website.trim()
  
  cleaned = cleaned.replace(/`/g, '')
  cleaned = cleaned.replace(/['"]/g, '')
  cleaned = cleaned.replace(/^https?:\/\//i, '')
  cleaned = cleaned.split('/')[0]
  
  if (!cleaned.includes('.')) return ''
  
  const safeProtocols = ['http://', 'https://']
  if (!safeProtocols.some(p => website.toLowerCase().startsWith(p))) {
    cleaned = `https://${cleaned}`
  }
  
  return cleaned
}

// 检查网站域名是否安全（过滤成人/垃圾网站）
function isWebsiteSafe(website: string): boolean {
  if (!website) return true
  
  const unsafeKeywords = [
    'porn', 'xxx', 'adult', 'sex', 'dating', 'escort', 'camgirl', 'hookup',
    'porno', 'erotic', 'nudity', 'babe', 'teen', 'tube', 'video',
    'casino', 'gambling', 'bet', 'lottery', 'crypto', 'token',
    'viagra', 'pharmacy', 'drug', 'medication', 'buyonline',
    'clickbank', 'affiliate', 'adnetwork', 'advertise', 'popup',
    'redirect', 'tracking', 'spyware', 'malware', 'virus'
  ]
  
  const domain = website.toLowerCase()
  for (const keyword of unsafeKeywords) {
    if (domain.includes(keyword)) {
      console.log("[AI Search] Filtered unsafe website:", website, "- contains:", keyword)
      return false
    }
  }
  
  return true
}

// 过滤不安全网站的客户
function filterUnsafeWebsites(customers: OverseasCustomer[]): OverseasCustomer[] {
  return customers.filter(customer => {
    if (!customer.website) return true
    const safe = isWebsiteSafe(customer.website)
    if (!safe) {
      console.log("[AI Search] Removed customer with unsafe website:", customer.companyName)
      customer.website = ''
    }
    return safe
  })
}

async function verifyWebsiteExists(website: string): Promise<boolean | null> {
  if (!website) return null
  
  const url = website.startsWith('http') ? website : `https://${website}`
  
  for (const method of ['HEAD', 'GET']) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(url, {
        method: method,
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MornHub/1.0)'
        }
      })
      
      clearTimeout(timeoutId)
      
      const status = response.status
      if (status >= 200 && status < 400) {
        return true
      }
      
      if (status >= 400 && status < 500) {
        console.log("[AI Search] Website confirmed not exists:", url, "status:", status)
        return false
      }
      
      console.log("[AI Search] Website verification uncertain:", url, "status:", status)
      return null
    } catch (error: any) {
      const errorCode = error.code || (error.cause && error.cause.code)
      if (errorCode === 'ERR_TLS_CERT_ALTNAME_INVALID' || 
          errorCode === 'ERR_TLS_CERT_INVALID') {
        console.log("[AI Search] Website TLS cert mismatch (not necessarily fake):", url)
        return null
      }
      
      if (errorCode === 'ERR_CONNECTION_REFUSED' || 
          errorCode === 'ENOTFOUND') {
        console.log("[AI Search] Website connection failed:", url, errorCode)
        return false
      }
      
      console.log("[AI Search] Website verification error (retrying):", url, errorCode)
    }
  }
  
  return null
}

async function validateAndCleanWebsites(customers: OverseasCustomer[]): Promise<OverseasCustomer[]> {
  for (const customer of customers) {
    if (!customer.website) continue
    
    const exists = await verifyWebsiteExists(customer.website)
    
    if (exists === false) {
      console.log("[AI Search] Clearing fake website for:", customer.companyName, "-", customer.website)
      customer.website = ''
    } else if (exists === null) {
      console.log("[AI Search] Could not verify website, keeping:", customer.companyName, "-", customer.website)
    }
  }
  
  return customers
}

// AI外网搜索功能 - 使用 Groq + Tavily 免费海外组合（停用 qwen-turbo）
// 业务流程：Tavily抓取海外企业官网 → Groq提取结构化数据 → 返回真实客户信息
async function searchWithAI(params: CustomerSearchParams, isPremium: boolean = false): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Starting AI web search with params:", params)
  console.log("[AI Search] Using Groq + Tavily FREE combination (qwen-turbo disabled)")
  
  // 步骤1：使用 Tavily Search API 抓取海外真实企业官网内容
  const webResults = await searchWithTavily(params)
  
  if (webResults.length === 0) {
    console.log("[AI Search] Tavily returned no results, returning empty (no mock fallback)")
    return []
  }
  
  // 步骤2：使用 Groq llama-3.3-70b-versatile 模型从网页内容中提取结构化企业数据
  const extractedCustomers = await extractWithGroq(webResults, params)
  
  // 步骤3：过滤非目标国家的公司
  const targetCountry = params.country || ''
  let filteredCustomers = extractedCustomers
  
  if (targetCountry && targetCountry.toLowerCase() !== 'all' && targetCountry.toLowerCase() !== 'global') {
    filteredCustomers = extractedCustomers.filter(customer => {
      const country = (customer.country || '').toLowerCase()
      const location = (customer.location || '').toLowerCase()
      const website = (customer.website || '').toLowerCase()
      const email = (customer.email || '').toLowerCase()
      
      const targetLower = targetCountry.toLowerCase()
      
      const isMatch = country.includes(targetLower) ||
                      location.includes(targetLower) ||
                      website.includes(`.${targetLower}`) ||
                      email.includes(`@`) && email.split('@')[1]?.toLowerCase().includes(`.${targetLower}`)
      
      if (!isMatch) {
        console.log("[AI Search] Filtered out non-target country:", customer.companyName, "- country:", customer.country)
      }
      return isMatch
    })
  }
  
  console.log("[AI Search] Groq + Tavily search completed, found", filteredCustomers.length, "real customers (after country filter)")
  
  // 步骤4：过滤不安全网站
  filteredCustomers = filterUnsafeWebsites(filteredCustomers)
  
  // 步骤5：清洗所有网站URL格式
  filteredCustomers.forEach(c => {
    if (c.website) {
      c.website = cleanAndValidateWebsite(c.website)
    }
  })
  
  // 步骤6：验证网站真实性（过滤404等无效网站）
  filteredCustomers = await validateAndCleanWebsites(filteredCustomers)
  
  console.log("[AI Search] After website safety filter:", filteredCustomers.length, "real customers")
  return filteredCustomers
}

// 基础版搜索（GLM模型）
async function searchWithGLMModel(params: CustomerSearchParams, hasSpecificFilter: boolean = false): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Starting GLM web search with params:", params)
  console.log("[AI Search] Has specific filter:", hasSpecificFilter)
  
  // GLM模型：根据筛选条件决定返回数量
  // - 有特定筛选条件（国家/业务类型）→ 返回8条
  // - 选择全部 → 返回12条
  const glmMaxResults = hasSpecificFilter ? 8 : 12
  
  try {
    const productKeywords = params.productCategories?.join(', ') || 'metal products'
    const targetCountry = params.country || 'global'
    const industryKeyword = params.industry || ''
    
    // 根据是否指定国家构建不同的搜索策略
    let searchQueries: string[] = []
    
    if (targetCountry && targetCountry.toLowerCase() !== 'all' && targetCountry.toLowerCase() !== 'global') {
      // 指定国家：详细查询每种业务类型
      const businessTypes = ['importers', 'distributors', 'manufacturers', 'wholesalers']
      searchQueries = businessTypes.map(type => 
        `Find 15-20 REAL ${type} of ${productKeywords} for ${industryKeyword || 'construction'} industry in ${targetCountry}. Return as many companies as possible. Include company name, location, phone, email, website.`
      )
    } else {
      // 全球搜索：优化为5个高效查询，覆盖主要地区
      searchQueries = [
        // 北美
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in United States, Canada, Mexico. Include company name, location, phone, email, website.`,
        // 欧洲
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Germany, United Kingdom, France, Italy, Spain. Include company name, location, phone, email, website.`,
        // 亚太
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Japan, South Korea, Australia, India, Singapore. Include company name, location, phone, email, website.`,
        // 中东和南美
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in UAE, Saudi Arabia, Brazil, Mexico, Indonesia. Include company name, location, phone, email, website.`,
        // 制造商和贸易公司
        `Find 15-20 REAL manufacturers and trading companies of ${productKeywords} for ${industryKeyword || 'construction'} industry globally. Include company name, location, phone, email, website.`
      ]
    }
    
    console.log("[AI Search] Number of search queries:", searchQueries.length)
    
    const apiKey = process.env.GLM_API_KEY
    const model = process.env.GLM_MODEL || "glm-4.7-flash"
    
    if (!apiKey) {
      console.warn("[AI Search] GLM_API_KEY not configured, returning empty")
      return []
    }
    
    // 收集所有查询结果
    const allResults: OverseasCustomer[] = []
    let totalResults = 0
    const maxRetries = 2 // 每个查询最多重试2次
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i]
      console.log("[AI Search] Executing query", i + 1, "/", searchQueries.length, ":", query.substring(0, 50) + "...")
      
      // 请求前添加延迟，避免过快调用
      if (i > 0) {
        await delay(1000) // 间隔1秒
      }
      
      let success = false
      let retries = 0
      
      while (!success && retries < maxRetries) {
        try {
          const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: "You MUST respond ONLY with valid JSON format. No explanations, no extra text. If you cannot find real data, return {\"results\": []}. You are a professional B2B trade researcher. Search for REAL, VERIFIABLE overseas companies and return accurate contact information."
                },
                {
                  role: "user",
                  content: `${query}

RESPONSE FORMAT REQUIREMENT: You MUST return a JSON object with a "results" array. Each item in the array must have these fields:
- id: unique string identifier
- companyName: company name
- companyNameEn: English company name
- industry: main industry
- location: full address
- country: country name
- city: city name
- contactPerson: contact person name (if available)
- email: company email (if available)
- phone: phone number with country code (if available)
- website: official website URL (if available)
- businessType: importer, distributor, manufacturer, or wholesaler
- productCategories: array of product categories
- certifications: array of certifications (if available)
- description: company description

EXAMPLE OUTPUT FORMAT:
{"results":[{"id":"1","companyName":"ABC Corp","companyNameEn":"ABC Corporation","industry":"Electronics","location":"123 Main St, New York","country":"United States","city":"New York","contactPerson":"John Smith","email":"contact@abccorp.com","phone":"+1-212-555-1234","website":"https://www.abccorp.com","businessType":"importer","productCategories":["electronics","components"],"certifications":["ISO9001"],"description":"ABC Corp is a leading importer..."}]}

Do NOT include any other text. Return ONLY valid JSON.`
                }
              ],
              max_tokens: 8192,
              temperature: 0.7
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            console.error("[AI Search] GLM API request failed (attempt", retries + 1, "):", response.status, errorData)
            
            if (response.status >= 500 && retries < maxRetries - 1) {
              retries++
              console.log("[AI Search] Retrying query... (attempt", retries + 1, ")")
              await delay(2000) // 重试前等待2秒
              continue
            }
            
            break
          }
          
          const data = await response.json()
          
          if (!data.choices || data.choices.length === 0) {
            console.warn("[AI Search] No results from GLM API")
            success = true
            continue
          }
          
          const responseText = data.choices[0].message.content
          console.log("[AI Search] Response text length:", responseText.length)
          
          const results = parseApiResponse(responseText)
          console.log("[AI Search] Results from this query:", results.length)
          
          // 验证并转换结果
          for (const item of results) {
            if (isValidCustomer(item) && isCustomerMatched(item, params)) {
              allResults.push({
                id: item.id || `ai_search_${Date.now()}_${totalResults}`,
                companyName: item.companyName || item.company_name || item.name || '',
                companyNameEn: item.companyNameEn || item.company_name_en || item.companyName || '',
                industry: item.industry || '',
                subIndustry: item.subIndustry || item.sub_industry || '',
                location: item.location || '',
                country: item.country || params.country || '',
                city: item.city || params.city || '',
                contactPerson: item.contactPerson || item.contact_person || '',
                email: item.email || '',
                phone: item.phone || '',
                website: item.website || '',
                socialLinks: item.socialLinks || item.social_links || [],
                businessType: item.businessType || item.business_type || '',
                annualRevenue: item.annualRevenue || item.annual_revenue || '',
                employeeCount: item.employeeCount || item.employee_count || '',
                foundedYear: item.foundedYear || item.founded_year || 0,
                productCategories: item.productCategories || item.product_categories || [],
                certifications: item.certifications || [],
                description: item.description || '',
                source: 'glm_search',
                createdAt: new Date(),
                updatedAt: new Date()
              })
              totalResults++
            }
          }
          
          success = true
          
          // 限制总结果数量（GLM模型根据筛选条件决定）
          if (totalResults >= glmMaxResults) {
            break
          }
        } catch (error) {
          console.error("[AI Search] GLM API request error (attempt", retries + 1, "):", error)
          if (retries < maxRetries - 1) {
            retries++
            console.log("[AI Search] Retrying query... (attempt", retries + 1, ")")
            await delay(2000)
          } else {
            break
          }
        }
      }
      
      if (totalResults >= glmMaxResults) {
        break
      }
    }
    
    console.log("[AI Search] Total valid real results before deduplication:", allResults.length)
    
    // 去重：只对完全相同的公司名称去重
    const seen = new Set<string>()
    const uniqueResults = allResults.filter(customer => {
      // 只根据公司名称去重（转小写）
      const companyNameLower = customer.companyName.toLowerCase().trim()
      if (seen.has(companyNameLower)) {
        return false
      }
      seen.add(companyNameLower)
      return true
    })
    
    console.log("[AI Search] Total valid real results after deduplication:", uniqueResults.length)
    
    if (uniqueResults.length === 0) {
      console.warn("[AI Search] No valid real data found from GLM (qwen-turbo disabled)")
      return []
    }
    
    // GLM模型：根据筛选条件返回结果
    // - 有特定筛选条件 → 返回8条
    // - 选择全部 → 返回12条
    return uniqueResults.slice(0, glmMaxResults)
  } catch (error) {
    console.error("[AI Search] GLM search failed (qwen-turbo disabled):", error)
    return []
  }
}

// 高端版搜索（Perplexity Sonar模型）- 不限制数量，全部返回
async function searchWithPremiumModel(params: CustomerSearchParams): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Starting premium model search with params:", params)
  console.log("[AI Search] Premium model: No result limit, returning all found")
  
  try {
    const productKeywords = params.productCategories?.join(', ') || 'metal products'
    const targetCountry = params.country || 'global'
    const industryKeyword = params.industry || ''
    
    // 高端版本：更多查询，覆盖更多地区
    let searchQueries: string[] = []
    
    if (targetCountry && targetCountry.toLowerCase() !== 'all' && targetCountry.toLowerCase() !== 'global') {
      // 指定国家：详细查询每种业务类型
      const businessTypes = ['importers', 'distributors', 'manufacturers', 'wholesalers', 'trading companies']
      searchQueries = businessTypes.map(type => 
        `Find 15-20 REAL ${type} of ${productKeywords} for ${industryKeyword || 'construction'} industry in ${targetCountry}. Return as many companies as possible. Include company name, location, phone, email, website.`
      )
    } else {
      // 全球搜索：10个高效查询，覆盖主要地区
      searchQueries = [
        // 北美
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in United States. Include company name, location, phone, email, website.`,
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Canada, Mexico. Include company name, location, phone, email, website.`,
        // 欧洲
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Germany, Netherlands, Belgium. Include company name, location, phone, email, website.`,
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in United Kingdom, France, Italy. Include company name, location, phone, email, website.`,
        // 亚太
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Japan, South Korea, Taiwan. Include company name, location, phone, email, website.`,
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Australia, New Zealand, Singapore. Include company name, location, phone, email, website.`,
        // 南亚和中东
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in India, Pakistan, Bangladesh. Include company name, location, phone, email, website.`,
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in UAE, Saudi Arabia, Qatar. Include company name, location, phone, email, website.`,
        // 南美和东南亚
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Brazil, Argentina, Chile. Include company name, location, phone, email, website.`,
        `Find 15-20 REAL importers and distributors of ${productKeywords} for ${industryKeyword || 'construction'} industry in Indonesia, Thailand, Vietnam, Malaysia. Include company name, location, phone, email, website.`
      ]
    }
    
    console.log("[AI Search] Premium: Number of search queries:", searchQueries.length)
    
    const apiKey = process.env.PREMIUM_API_KEY || process.env.OPENROUTER_API_KEY
    const model = process.env.PREMIUM_MODEL || "perplexity/sonar-pro-search"
    
    if (!apiKey) {
      console.warn("[AI Search] Premium API key not configured, falling back to GLM")
      return searchWithGLMModel(params)
    }
    
    // 收集所有查询结果
    const allResults: OverseasCustomer[] = []
    
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i]
      console.log("[AI Search] Premium executing query", i + 1, "/", searchQueries.length)
      
      if (i > 0) {
        await delay(1500) // 高端版间隔1.5秒
      }
      
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: "You are a professional B2B trade researcher. Search the internet for REAL, VERIFIABLE overseas companies. Provide ACCURATE information only. Return ONLY valid JSON."
              },
              {
                role: "user",
                content: `${query}

Return ONLY a JSON object with "results" array containing company information:
{
  "results": [
    {
      "id": "unique-id",
      "companyName": "Company Name",
      "companyNameEn": "Company Name EN",
      "industry": "Industry",
      "location": "Full address",
      "country": "Country",
      "city": "City",
      "contactPerson": "Contact person",
      "email": "email@example.com",
      "phone": "+1-234-567-8900",
      "website": "https://www.example.com",
      "businessType": "importer",
      "productCategories": ["category1"],
      "certifications": ["ISO9001"],
      "description": "Company description"
    }
  ]
}`
              }
            ],
            max_tokens: 8192,
            temperature: 0.7
          })
        })
        
        if (!response.ok) {
          console.warn("[AI Search] Premium API request failed:", response.status)
          continue
        }
        
        const data = await response.json()
        if (!data.choices || data.choices.length === 0) continue
        
        const responseText = data.choices[0].message.content
        const results = parseApiResponse(responseText)
        
        // 验证并转换结果
        for (const item of results) {
          if (isValidCustomer(item) && isCustomerMatched(item, params)) {
            allResults.push({
              id: item.id || `premium_${Date.now()}_${allResults.length}`,
              companyName: item.companyName || item.company_name || item.name || '',
              companyNameEn: item.companyNameEn || item.company_name_en || item.companyName || '',
              industry: item.industry || '',
              subIndustry: item.subIndustry || '',
              location: item.location || '',
              country: item.country || params.country || '',
              city: item.city || '',
              contactPerson: item.contactPerson || '',
              email: item.email || '',
              phone: item.phone || '',
              website: item.website || '',
              socialLinks: [],
              businessType: item.businessType || '',
              productCategories: item.productCategories || [],
              certifications: item.certifications || [],
              description: item.description || '',
              source: 'premium_search',
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        }
        
      } catch (error) {
        console.error("[AI Search] Premium query error:", error)
      }
    }
    
    // 去重
    const seen = new Set<string>()
    const uniqueResults = allResults.filter(customer => {
      const key = customer.companyName.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    
    console.log("[AI Search] Premium: Total results after deduplication:", uniqueResults.length)
    
    // 高端版：不限制数量，返回所有搜索结果（由前端分页处理）
    return uniqueResults
  } catch (error) {
    console.error("[AI Search] Premium search failed:", error)
    return []
  }
}

// OpenRouter备用搜索（当GLM失败时使用）
async function searchWithOpenRouter(params: CustomerSearchParams): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Falling back to OpenRouter search")
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.warn("[AI Search] OpenRouter API key not configured")
      return []
    }
    
    const productKeywords = params.productCategories?.join(', ') || 'metal products'
    const targetCountry = params.country || 'Japan'
    const industryKeyword = params.industry || 'construction'
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "perplexity/sonar-pro-search",
        messages: [
          {
            role: "system",
            content: "You are a professional B2B trade researcher. Search the internet for REAL, VERIFIABLE overseas companies. Provide ACCURATE information only. Return ONLY valid JSON array."
          },
          {
            role: "user",
            content: `Find 3-5 REAL overseas importer/distributor companies in the ${industryKeyword} industry that use ${productKeywords} in ${targetCountry}. Return as JSON array with: id, companyName, companyNameEn, industry, location, country, city, contactPerson, email, phone, website, businessType, productCategories, certifications, description.`
          }
        ],
        max_tokens: 4096
      })
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    if (!data.choices || data.choices.length === 0) return []
    
    const responseText = data.choices[0].message.content
    let cleanResponse = responseText.trim()
    if (cleanResponse.startsWith("```json")) cleanResponse = cleanResponse.slice(7)
    if (cleanResponse.endsWith("```")) cleanResponse = cleanResponse.slice(0, -3)
    
    const firstBracket = cleanResponse.indexOf('[')
    const lastBracket = cleanResponse.lastIndexOf(']')
    if (firstBracket === -1 || lastBracket === -1) return []
    
    cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1)
    
    const results = JSON.parse(cleanResponse)
    if (!Array.isArray(results)) return []
    
    return results.map((item: any, index: number) => ({
      id: item.id || `or_search_${Date.now()}_${index}`,
      companyName: item.companyName || item.name || '',
      companyNameEn: item.companyNameEn || item.companyName || '',
      industry: item.industry || '',
      subIndustry: item.subIndustry || '',
      location: item.location || '',
      country: item.country || params.country || '',
      city: item.city || '',
      contactPerson: item.contactPerson || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      socialLinks: [],
      businessType: item.businessType || '',
      productCategories: item.productCategories || [],
      certifications: item.certifications || [],
      description: item.description || '',
      source: 'openrouter_search',
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  } catch (error) {
    console.error("[AI Search] OpenRouter fallback failed:", error)
    return []
  }
}

// qwen-turbo搜索（支持联网搜索）
async function searchWithQwenModel(params: CustomerSearchParams, maxResults: number = 12): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Using Qwen-Turbo model with web search enabled")
  
  try {
    const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY
    const model = process.env.ALIYUN_EMAIL_MODEL || "qwen-turbo"
    
    if (!apiKey) {
      console.warn("[AI Search] Aliyun DashScope API key not configured")
      return searchWithOpenRouter(params)
    }
    
    const productKeywords = params.productCategories?.join(', ') || 'metal products'
    const targetCountry = params.country || 'Japan'
    const businessType = params.businessType || 'importer'
    const industryKeyword = params.industry || 'construction'
    
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        input: {
          messages: [
            {
              role: "system",
              content: "你是专业的B2B贸易研究员。搜索互联网上真实存在的海外公司，返回准确的企业信息。严禁虚构任何企业、地址、电话、邮箱。如果信息不完整，可以留空但必须保证已填写的信息真实有效。返回格式为JSON数组。"
            },
            {
              role: "user",
              content: `查找位于 ${targetCountry} 的 ${industryKeyword} 行业中使用 ${productKeywords} 的 ${businessType} 公司，返回10-15家真实存在的公司。每个公司应包含：公司名、英文名、行业、地址、国家（必须为${targetCountry}）、城市、联系人、邮箱、电话、官网地址、业务类型、产品品类、认证、描述。\n\n如果找不到完整信息，可以只提供你能找到的部分，但必须保证真实。\n\nJSON格式：[{"id":"xxx","companyName":"公司名","companyNameEn":"英文名","industry":"行业","location":"地址","country":"${targetCountry}","city":"城市","contactPerson":"联系人","email":"邮箱","phone":"电话","website":"网站","businessType":"业务类型","productCategories":["品类"],"certifications":["认证"],"description":"描述"}]`
            }
          ]
        },
        parameters: {
          max_tokens: 8192,
          temperature: 0.2,
          enable_search: true,
          forced_search: true,
          region: "global"
        }
      })
    })
    
    if (!response.ok) {
      console.warn("[AI Search] Qwen-Turbo API request failed:", response.status)
      return searchWithOpenRouter(params)
    }
    
    const data = await response.json()
    console.log("[AI Search] Qwen-Turbo FULL raw response:", JSON.stringify(data, null, 2))
    
    if (!data.output || !data.output.text) {
      console.warn("[AI Search] Qwen-Turbo returned empty response")
      return searchWithOpenRouter(params)
    }
    
    const responseText = data.output.text.trim()
    
    // 清理响应文本
    let cleanResponse = responseText
    if (cleanResponse.startsWith("```json")) cleanResponse = cleanResponse.slice(7)
    if (cleanResponse.endsWith("```")) cleanResponse = cleanResponse.slice(0, -3)
    
    const firstBracket = cleanResponse.indexOf('[')
    const lastBracket = cleanResponse.lastIndexOf(']')
    if (firstBracket === -1 || lastBracket === -1) {
      console.warn("[AI Search] Qwen-Turbo response format error")
      return searchWithOpenRouter(params)
    }
    
    cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1)
    
    const results = JSON.parse(cleanResponse)
    if (!Array.isArray(results)) {
      console.warn("[AI Search] Qwen-Turbo response is not an array")
      return searchWithOpenRouter(params)
    }
    
    // 打印原始返回数据用于调试
    console.log("[AI Search] Qwen-Turbo raw results count:", results.length)
    if (results.length > 0) {
      console.log("[AI Search] Qwen-Turbo raw sample:", JSON.stringify(results.slice(0, 3), null, 2))
    }
    
    // 验证并转换结果
    const validResults = results.filter((item: any) => isValidCustomer(item) && isCustomerMatched(item, params))
    
    console.log("[AI Search] Qwen-Turbo found", validResults.length, "valid results")
    
    return validResults.map((item: any, index: number) => ({
      id: item.id || `qwen_${Date.now()}_${index}`,
      companyName: item.companyName || item.name || '',
      companyNameEn: item.companyNameEn || item.companyName || '',
      industry: item.industry || '',
      subIndustry: item.subIndustry || '',
      location: item.location || '',
      country: item.country || params.country || '',
      city: item.city || '',
      contactPerson: item.contactPerson || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      socialLinks: [],
      businessType: item.businessType || '',
      productCategories: item.productCategories || [],
      certifications: item.certifications || [],
      description: item.description || '',
      source: 'qwen_search',
      createdAt: new Date(),
      updatedAt: new Date()
    })).slice(0, maxResults)
    
  } catch (error) {
    console.error("[AI Search] Qwen-Turbo fallback failed:", error)
    return searchWithOpenRouter(params)
  }
}

// 根据搜索条件生成模拟客户数据（当AI搜索失败时使用）
function generateMockCustomersForSearch(params: CustomerSearchParams): OverseasCustomer[] {
  const customers: OverseasCustomer[] = []
  const country = params.country || "Japan"
  
  // 根据产品品类生成相关客户（英文）
  const categoryMapEn: Record<string, string> = {
    "Aluminum profiles": "Aluminum Profiles",
    "Aluminum doors and windows": "Aluminum Doors & Windows",
    "Aluminum railings": "Aluminum Railings",
    "Aluminum curtain walls": "Curtain Walls",
    "Industrial aluminum profiles": "Industrial Aluminum"
  }
  
  // 业务类型映射
  const businessTypeLabels: Record<string, string> = {
    importer: "Importer",
    distributor: "Distributor",
    manufacturer: "Manufacturer",
    retailer: "Retailer",
    wholesaler: "Wholesaler",
    agent: "Agent"
  }
  
  // 英文行业名称映射
  const industryEnMap: Record<string, string> = {
    "美妆": "Cosmetics & Beauty",
    "美容": "Cosmetics & Beauty",
    "化妆品": "Cosmetics & Beauty",
    "制造业": "Manufacturing",
    "建筑": "Construction",
    "建材": "Building Materials",
    "电子": "Electronics"
  }
  
  // 英文公司名称前缀
  const companyPrefixes = ["Alpha", "Prime", "Global", "Pacific", "Nippon", "Euro", "Asia", "Tech"]
  
  // 英文联系人名字
  const firstNames = ["John", "Michael", "David", "James", "Robert", "William", "Richard", "Joseph"]
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Moore"]
  
  // 确保生成的客户能够匹配搜索条件
  const categories = params.productCategories || []
  const certifications = params.certifications || []
  const businessType = params.businessType || "manufacturer"
  const industry = params.industry || "制造业"
  const industryEn = industryEnMap[industry] || "Manufacturing"
  
  // 生成足够的数据确保分页显示（至少14条）
  for (let i = 0; i < 14; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)] || "Aluminum profiles"
    const categoryEn = categoryMapEn[randomCategory] || "Aluminum Products"
    
    // 生成英文公司名称
    const companyNameEn = `${companyPrefixes[i % companyPrefixes.length]} ${categoryEn} ${["Co.", "Inc.", "Ltd.", "Corporation", "Group"][i % 5]}`
    
    // 生成日文公司名称（如果是日本）
    const companyNameJaList = ["アルミニウムテクノ株式会社", "グローバルメタル株式会社", "プレミアムアルミ株式会社", "パシフィックアルミ株式会社", "ジャパンメタルズ株式会社",
                              "東洋プラスチック株式会社", "日本樹脂工業株式会社", "旭化成プラスチック株式会社", "三菱化学プラスチック株式会社", "住友化学株式会社",
                              "日立化成株式会社", "東レ株式会社", "帝人株式会社", "クラレ株式会社"]
    const companyNameJa = companyNameJaList[i]
    
    // 生成联系人
    const contactPerson = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`
    
    // 生成位置
    const locations = {
      "Japan": ["Chiyoda-ku, Tokyo", "Osaka-shi, Osaka", "Nagoya-shi, Aichi", "Kyoto-shi, Kyoto", "Fukuoka-shi, Fukuoka"],
      "China": ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Hangzhou"],
      "United States": ["Los Angeles, CA", "New York, NY", "Chicago, IL", "Houston, TX", "Phoenix, AZ"],
      "Germany": ["Munich", "Berlin", "Frankfurt", "Hamburg", "Cologne"],
      "default": ["City Center", "Industrial Zone", "Business District", "Tech Park", "Commercial Area"]
    }
    
    customers.push({
      id: `mock_${Date.now()}_${i}`,
      companyName: country === "Japan" ? companyNameJa : companyNameEn,
      companyNameEn: companyNameEn,
      industry: industryEn,
      subIndustry: categoryEn,
      location: locations[country as keyof typeof locations]?.[i] || locations.default[i],
      country: country,
      city: country === "Japan" ? ["Tokyo", "Osaka", "Nagoya", "Kyoto", "Fukuoka"][i] : 
             country === "China" ? ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Hangzhou"][i] :
             country === "United States" ? ["Los Angeles", "New York", "Chicago", "Houston", "Phoenix"][i] :
             ["City", "Metropolis", "Town", "Village", "District"][i],
      contactPerson: contactPerson,
      email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@${companyPrefixes[i % companyPrefixes.length].toLowerCase()}${categoryEn.replace(/\s+/g, '')}.com`,
      phone: country === "Japan" ? `+81-3-${String(1234 + i * 100).padStart(4, '0')}-${String(5678 + i * 100).padStart(4, '0')}` :
             country === "China" ? `+86-10-${String(1234 + i * 100).padStart(4, '0')}-${String(5678 + i * 100).padStart(4, '0')}` :
             `+1-${String(212 + i).padStart(3, '0')}-${String(123 + i * 100).padStart(3, '0')}-${String(4567 + i * 100).padStart(4, '0')}`,
      website: `https://www.${companyPrefixes[i % companyPrefixes.length].toLowerCase()}${categoryEn.replace(/\s+/g, '')}.com`,
      businessType: businessTypeLabels[businessType] || businessType,
      productCategories: [...categories.slice(i % categories.length, Math.min(i % categories.length + 2, categories.length)), randomCategory],
      certifications: certifications.length > 0 ? certifications.slice(0, Math.min(2, certifications.length)) : ["ISO9001", "ISO14001"],
      description: `A leading ${industryEn.toLowerCase()} ${categoryEn.toLowerCase()} supplier in ${country}. Specializes in manufacturing and distributing high-quality ${categoryEn.toLowerCase()} products for ${industryEn.toLowerCase()} businesses worldwide.`,
      source: 'mock_search',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  console.log("[AI Search] Generated mock customers for search:", customers.length)
  return customers
}

// 合并客户数据（去重）
function mergeCustomers(dbCustomers: OverseasCustomer[], aiCustomers: OverseasCustomer[]): OverseasCustomer[] {
  const existingIds = new Set(dbCustomers.map(c => c.id))
  const merged = [...dbCustomers]
  
  for (const customer of aiCustomers) {
    if (!existingIds.has(customer.id)) {
      merged.push(customer)
      existingIds.add(customer.id)
    }
  }
  
  return merged
}

// 计算匹配度
function calculateMatchScore(customer: OverseasCustomer, params: CustomerSearchParams): { score: number; matchedCategories: string[]; matchedCertifications: string[] } {
  let matchScore = 0
  const matchedCategories: string[] = []
  const matchedCertifications: string[] = []
  
  // 产品品类匹配
  if (params.productCategories && params.productCategories.length > 0) {
    for (const category of params.productCategories) {
      const lowerCategory = category.toLowerCase()
      for (const customerCategory of customer.productCategories) {
        if (customerCategory.toLowerCase().includes(lowerCategory) || 
            lowerCategory.includes(customerCategory.toLowerCase())) {
          matchScore += 15
          if (!matchedCategories.includes(customerCategory)) {
            matchedCategories.push(customerCategory)
          }
        }
      }
    }
  }
  
  // 行业匹配
  if (params.industry) {
    if (customer.industry.toLowerCase().includes(params.industry.toLowerCase()) ||
        customer.subIndustry.toLowerCase().includes(params.industry.toLowerCase())) {
      matchScore += 10
    }
  }
  
  // 国家匹配
  if (params.country) {
    if (customer.country.toLowerCase() === params.country.toLowerCase()) {
      matchScore += 5
    }
  }
  
  // 城市匹配
  if (params.city) {
    if (customer.city.toLowerCase() === params.city.toLowerCase()) {
      matchScore += 3
    }
  }
  
  // 业务类型匹配
  if (params.businessType) {
    if (customer.businessType === params.businessType.toLowerCase()) {
      matchScore += 5
    }
  }
  
  // 认证匹配
  if (params.certifications && params.certifications.length > 0) {
    for (const cert of params.certifications) {
      const lowerCert = cert.toLowerCase()
      for (const customerCert of customer.certifications) {
        if (customerCert.toLowerCase().includes(lowerCert)) {
          matchScore += 8
          if (!matchedCertifications.includes(customerCert)) {
            matchedCertifications.push(customerCert)
          }
        }
      }
    }
  }
  
  // 关键词匹配
  if (params.keywords && params.keywords.length > 0) {
    for (const keyword of params.keywords) {
      const lowerKeyword = keyword.toLowerCase()
      if (customer.companyName.toLowerCase().includes(lowerKeyword) ||
          customer.description.toLowerCase().includes(lowerKeyword)) {
        matchScore += 5
      }
    }
  }
  
  return { score: matchScore, matchedCategories, matchedCertifications }
}

// 从数据库获取客户数据
async function getCustomersFromDB(noFallback: boolean = false): Promise<OverseasCustomer[]> {
  try {
    const rows = await dbAdapter.loadRows("overseas_customers", {})
    
    // 如果数据库为空，返回mock数据作为备用（除非禁用回退）
    if (!rows || rows.length === 0) {
      console.log("[Customer Search] Database is empty")
      if (noFallback) {
        return []
      }
      console.log("[Customer Search] Returning mock data as fallback")
      return mockCustomers
    }
    
    return rows.map(row => {
      // 安全解析数组字段
      const parseArrayField = (value: any): string[] => {
        if (!value) return []
        if (Array.isArray(value)) return value
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value)
            return Array.isArray(parsed) ? parsed : [parsed]
          } catch {
            // 可能是PostgreSQL数组格式或普通字符串
            if (value.startsWith('{') && value.endsWith('}')) {
              return value.slice(1, -1).split(',').filter(Boolean)
            }
            return value ? [value] : []
          }
        }
        return []
      }
      
      return {
        id: row.id || row.ID,
        companyName: row.company_name || row.companyName || '',
        companyNameEn: row.company_name_en || row.companyNameEn || '',
        industry: row.industry || '',
        subIndustry: row.sub_industry || row.subIndustry || '',
        location: row.location || '',
        country: row.country || '',
        city: row.city || '',
        contactPerson: row.contact_person || row.contactPerson || '',
        email: row.email || '',
        phone: row.phone || '',
        website: row.website || '',
        socialLinks: parseArrayField(row.social_links),
        businessType: row.business_type || row.businessType || '',
        annualRevenue: row.annual_revenue || row.annualRevenue || '',
        employeeCount: row.employee_count || row.employeeCount || '',
        foundedYear: row.founded_year || row.foundedYear || 0,
        productCategories: parseArrayField(row.product_categories),
        certifications: parseArrayField(row.certifications),
        description: row.description || '',
        source: row.source || '',
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
      }
    })
  } catch (error) {
    // 如果数据库查询失败，返回mock数据
    console.log("[Customer Search] Database query failed, returning mock data:", error)
    return mockCustomers
  }
}

// 搜索客户（支持分页）
export async function searchCustomers(
  params: CustomerSearchParams,
  page: number = 1,
  pageSize: number = 10,
  isPremium: boolean = false
): Promise<{ 
  results: CustomerMatchResult[]; 
  total: number; 
  allCustomerIds: string[];
  dbResults: CustomerMatchResult[];
  aiResults: CustomerMatchResult[];
}> {
  // 调试日志
  console.log("[Customer Search] Search params:", JSON.stringify(params, null, 2))
  console.log("[Customer Search] User is Premium:", isPremium)
  
  // 1. 使用AI进行外网搜索（使用 Groq + Tavily 组合）
  const aiCustomers = await searchWithAI(params, isPremium)
  
  // 调试日志
  console.log("[Customer Search] Total customers found by AI:", aiCustomers.length)
  
  // 2. 从数据库获取已有客户（作为补充）- 不使用mock数据
  const dbCustomers = await getCustomersFromDB(true) // true表示不使用mock回退
  
  // 调试日志
  console.log("[Customer Search] Total customers found in DB:", dbCustomers.length)
  
  // 3. 合并数据（去重）- AI搜索结果优先
  let allCustomers = mergeCustomers(aiCustomers, dbCustomers)
  
  // 4. 确保测试公司存在（用于测试邮件发送）
  const testCompany = mockCustomers.find(c => c.id === 'test_company')
  if (testCompany) {
    const testCompanyExists = allCustomers.some(c => c.id === testCompany.id)
    if (!testCompanyExists) {
      allCustomers = [testCompany, ...allCustomers]
    }
  }
  
  // 调试日志
  console.log("[Customer Search] Total customers after merge:", allCustomers.length)
  
  // 计算匹配度
  const matches: CustomerMatchResult[] = []
  for (const customer of allCustomers) {
    const { score, matchedCategories, matchedCertifications } = calculateMatchScore(customer, params)
    // 调试日志：打印每个客户的匹配信息
    console.log(`[Customer Search] Customer: ${customer.companyName}, Score: ${score}, Categories: ${customer.productCategories.join(',')}`)
    
    // 测试公司始终显示（匹配度至少为1）
    const finalScore = customer.id === 'test_company' ? Math.max(1, score) : score
    
    if (finalScore > 0) {
      matches.push({
        customer,
        matchScore: finalScore,
        matchedCategories,
        matchedCertifications
      })
    }
  }
  
  // 调试日志
  console.log("[Customer Search] Total matched customers:", matches.length)
  
  // 按匹配度排序（测试公司始终排在最前面）
  matches.sort((a, b) => {
    // 测试公司优先
    if (a.customer.id === 'test_company') return -1
    if (b.customer.id === 'test_company') return 1
    // 其他按匹配度排序
    return b.matchScore - a.matchScore
  })
  
  // 最终去重（确保不会显示重复的客户）
  const seenIds = new Set<string>()
  const uniqueMatches = matches.filter(match => {
    if (seenIds.has(match.customer.id)) {
      console.log(`[Customer Search] Removing duplicate customer: ${match.customer.companyName}`)
      return false
    }
    seenIds.add(match.customer.id)
    return true
  })
  
  // 获取所有匹配的客户ID（用于保存搜索记录）
  const allCustomerIds = uniqueMatches.map(m => m.customer.id)
  
  // 区分本地库客户和AI检索客户
  const aiResultIds = new Set(aiCustomers.map(c => c.id))
  const dbResults = uniqueMatches.filter(m => !aiResultIds.has(m.customer.id))
  const aiResults = uniqueMatches.filter(m => aiResultIds.has(m.customer.id))
  
  // 调试日志
  console.log("[Customer Search] DB results:", dbResults.length, "AI results:", aiResults.length)
  
  // 分页处理（使用去重后的结果）
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedResults = uniqueMatches.slice(start, end)
  
  // 调试日志
  console.log("[Customer Search] Returning page:", page, "results:", paginatedResults.length, "total unique:", uniqueMatches.length)
  
  return {
    results: paginatedResults,
    total: uniqueMatches.length,
    allCustomerIds,
    dbResults,
    aiResults
  }
}

// 获取搜索记录
export async function getSearchRecord(searchId: string): Promise<any | null> {
  try {
    const rows = await dbAdapter.loadRows("ai_customer_searches", { id: searchId })
    if (rows.length === 0) return null
    
    const record = rows[0]
    const now = new Date()
    const expiresAt = new Date(record.expires_at)
    
    // 检查是否过期
    if (now > expiresAt) {
      // 删除过期记录
      await dbAdapter.deleteRow("ai_customer_searches", { id: searchId })
      return null
    }
    
    return record
  } catch {
    return null
  }
}

// 保存搜索记录
export async function saveSearchRecord(
  userId: string,
  params: CustomerSearchParams,
  customerIds: string[]
): Promise<string> {
  const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30分钟后过期
  const now = new Date().toISOString()
  
  await dbAdapter.insertRow("ai_customer_searches", {
    id: searchId,
    user_id: userId,
    search_params: JSON.stringify(params),
    result_ids: customerIds.join(','),
    total_count: customerIds.length,
    created_at: now,
    updated_at: now,
    expires_at: expiresAt.toISOString()
  })
  
  return searchId
}

// 获取分页结果
export async function getSearchResults(
  searchId: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ results: CustomerMatchResult[]; total: number } | null> {
  const record = await getSearchRecord(searchId)
  if (!record) return null
  
  const customerIds = record.result_ids.split(',').filter(Boolean)
  
  // 获取所有可能的客户数据来源
  let allCustomers = await getCustomersFromDB()
  
  // 添加所有mock数据（包括测试公司和AI生成的数据）
  for (const mockCustomer of mockCustomers) {
    const exists = allCustomers.some(c => c.id === mockCustomer.id)
    if (!exists) {
      allCustomers.push(mockCustomer)
    }
  }
  
  // 添加AI搜索时生成的临时mock数据
  const params = record.search_params ? JSON.parse(record.search_params) : {}
  const aiMockCustomers = await generateMockCustomers(params)
  for (const aiCustomer of aiMockCustomers) {
    const exists = allCustomers.some(c => c.id === aiCustomer.id)
    if (!exists) {
      allCustomers.push(aiCustomer)
    }
  }
  
  // 根据保存的ID顺序获取客户
  const matchedCustomers = customerIds
    .map(id => allCustomers.find(c => c.id === id))
    .filter((c): c is OverseasCustomer => c !== undefined)
  
  // 解析搜索参数
  let searchParams: CustomerSearchParams = {}
  try {
    searchParams = JSON.parse(record.search_params)
  } catch {}
  
  // 计算匹配度并返回
  const results = matchedCustomers.map(customer => {
    const { score, matchedCategories, matchedCertifications } = calculateMatchScore(customer, searchParams)
    const finalScore = customer.id === 'test_company' ? Math.max(1, score) : score
    return {
      customer,
      matchScore: finalScore,
      matchedCategories,
      matchedCertifications
    }
  })
  
  // 分页
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    results: results.slice(start, end),
    total: results.length
  }
}

// 清理过期搜索记录
export async function cleanupExpiredSearches(): Promise<void> {
  try {
    await dbAdapter.execute(`DELETE FROM ai_customer_searches WHERE expires_at < NOW()`);
  } catch (error) {
    console.error("Failed to cleanup expired searches:", error)
  }
}

export function getCustomerById(id: string): OverseasCustomer | undefined {
  return mockCustomers.find(c => c.id === id)
}

export function getAllCustomers(): OverseasCustomer[] {
  return mockCustomers
}

export function getCountries(): string[] {
  const countries = new Set(mockCustomers.map(c => c.country))
  return Array.from(countries).sort()
}

export function getBusinessTypes(): string[] {
  return ['importer', 'distributor', 'manufacturer', 'retailer', 'wholesaler', 'agent']
}
