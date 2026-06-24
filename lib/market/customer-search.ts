import { OverseasCustomer, CustomerSearchParams, CustomerMatchResult } from "./customer-types"
import { dbAdapter } from "./db-adapter"
import { getAIProvider } from "@/lib/ai/provider"

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
    email: 'info0623@126.com',
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
  
  // 验证邮箱是否有完整域名（排除假邮箱）
  const email = item.email || ''
  if (email && !email.includes('@') && !email.includes('.')) {
    console.log("[AI Search] Filtered invalid email:", email, "for company:", companyName)
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

// AI外网搜索功能 - 根据会员状态选择模型
async function searchWithAI(params: CustomerSearchParams, isPremium: boolean = false): Promise<OverseasCustomer[]> {
  console.log("[AI Search] Starting AI web search with params:", params)
  console.log("[AI Search] Using premium model:", isPremium)
  
  // 根据会员状态选择模型和API
  const usePremium = isPremium && process.env.ENABLE_PREMIUM_AI === 'true'
  
  if (usePremium) {
    console.log("[AI Search] Using premium AI model (Perplexity)")
    return searchWithPremiumModel(params)
  } else {
    // 默认使用 qwen-turbo（带联网搜索）作为主要模型
    console.log("[AI Search] Using primary AI model (Qwen-Turbo with web search)")
    const qwenResults = await searchWithQwenModel(params, hasSpecificFilter(params))
    
    // 如果 qwen-turbo 返回结果为空或失败，降级到 GLM
    if (qwenResults.length === 0) {
      console.warn("[AI Search] Qwen-Turbo returned no results, falling back to GLM")
      return searchWithGLMModel(params, hasSpecificFilter(params))
    }
    
    return qwenResults
  }
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
      console.warn("[AI Search] No valid real data found from GLM, falling back to Qwen-Turbo")
      return searchWithQwenModel(params, glmMaxResults)
    }
    
    // GLM模型：根据筛选条件返回结果
    // - 有特定筛选条件 → 返回8条
    // - 选择全部 → 返回12条
    return uniqueResults.slice(0, glmMaxResults)
  } catch (error) {
    console.error("[AI Search] GLM search failed, falling back to Qwen-Turbo:", error)
    return searchWithQwenModel(params, glmMaxResults)
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
              content: "你是专业的B2B贸易研究员。请搜索互联网上真实、可验证的海外公司信息。只提供准确的信息。返回格式为JSON数组。"
            },
            {
              role: "user",
              content: `查找 ${targetCountry} 的 ${industryKeyword} 行业中使用 ${productKeywords} 的 ${businessType} 公司，返回10-15家真实存在的公司。JSON格式：[{"id":"xxx","companyName":"公司名","companyNameEn":"英文名","industry":"行业","location":"地址","country":"国家","city":"城市","contactPerson":"联系人","email":"邮箱","phone":"电话","website":"网站","businessType":"业务类型","productCategories":["品类"],"certifications":["认证"],"description":"描述"}]`
            }
          ]
        },
        parameters: {
          max_tokens: 8192,
          temperature: 0.7,
          enable_search: true  // 启用联网搜索！
        }
      })
    })
    
    if (!response.ok) {
      console.warn("[AI Search] Qwen-Turbo API request failed:", response.status)
      return searchWithOpenRouter(params)
    }
    
    const data = await response.json()
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
): Promise<{ results: CustomerMatchResult[]; total: number; allCustomerIds: string[] }> {
  // 调试日志
  console.log("[Customer Search] Search params:", JSON.stringify(params, null, 2))
  console.log("[Customer Search] User is Premium:", isPremium)
  
  // 1. 使用AI进行外网搜索（根据会员状态选择模型）
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
  
  // 分页处理（使用去重后的结果）
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedResults = uniqueMatches.slice(start, end)
  
  // 调试日志
  console.log("[Customer Search] Returning page:", page, "results:", paginatedResults.length, "total unique:", uniqueMatches.length)
  
  return {
    results: paginatedResults,
    total: uniqueMatches.length,
    allCustomerIds
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
