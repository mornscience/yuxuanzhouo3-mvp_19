"use client"

import { useState, useEffect } from "react"
import { Search, Users, MapPin, Briefcase, Phone, Mail, Globe, Building2, Tag, Award, Loader2, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Sparkles, RefreshCw, Send, Edit3, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { CustomerMatchResult, OverseasCustomer } from "@/lib/market/customer-types"
import type { UserMarketProfile } from "@/lib/market/acquisition-types"

const businessTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'importer', label: 'Importer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'agent', label: 'Agent' }
]

const countries = [
  { value: 'all', label: 'All Countries' },
  { value: 'United States', label: 'United States' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Japan', label: 'Japan' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'China', label: 'China' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Sweden', label: 'Sweden' },
  { value: 'UAE', label: 'UAE' }
]

const MAX_CUSTOMER_SEARCH_COUNT = 60

export function AICustomerSearch() {
  const [profile, setProfile] = useState<UserMarketProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [matchedCustomers, setMatchedCustomers] = useState<CustomerMatchResult[]>([])
  const [customerSearchCount, setCustomerSearchCount] = useState(0)
  
  // 搜索条件
  const [searchKeywords, setSearchKeywords] = useState('')
  const [selectedBusinessType, setSelectedBusinessType] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  
  // 预填充的搜索条件（从企业画像获取）
  const [productCategories, setProductCategories] = useState<string[]>([])
  const [certifications, setCertifications] = useState<string[]>([])
  const [industry, setIndustry] = useState('')

  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [searchId, setSearchId] = useState<string | null>(null)
  
  // 已保存客户状态
  const [showSavedCustomers, setShowSavedCustomers] = useState(false)
  const [savedCustomers, setSavedCustomers] = useState<OverseasCustomer[]>([])
  const [loadingSavedCustomers, setLoadingSavedCustomers] = useState(false)
  
  // 邮件弹窗状态
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<CustomerMatchResult | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [currentDraftId, setCurrentDraftId] = useState('')
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile/merchant-info", { credentials: "include" })
      const result = await response.json()
      
      if (result.ok && result.data) {
        setProfile(result.data)
        
        // 获取精准寻客次数
        const searchCount = Number(result.data.customerSearchCount ?? result.data.customer_search_count ?? 0)
        setCustomerSearchCount(searchCount)
        
        // 提取搜索条件
        const data = result.data
        if (data.product_categories) {
          try {
            setProductCategories(JSON.parse(data.product_categories))
          } catch {}
        }
        if (data.quality_certifications) {
          try {
            setCertifications(JSON.parse(data.quality_certifications))
          } catch {}
        }
        if (data.industry) {
          setIndustry(data.industry)
        }
      }
    } catch (error) {
      console.error("加载企业信息失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (resetPage: boolean = true) => {
    setSearching(true)
    
    try {
      const currentPage = resetPage ? 1 : page
      const requestBody = {
        productCategories,
        certifications,
        industry,
        businessType: selectedBusinessType === 'all' ? '' : selectedBusinessType,
        country: selectedCountry === 'all' ? '' : selectedCountry,
        keywords: searchKeywords.split(',').map(k => k.trim()).filter(k => k),
        page: currentPage,
        pageSize
      }
      
      const response = await fetch("/api/market/match-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      if (result.ok && result.data) {
        setMatchedCustomers(result.data)
        setTotal(result.total || 0)
        setPage(currentPage)
        if (result.searchId) {
          setSearchId(result.searchId)
        }
        // 更新使用次数
        if (result.customerSearchCount !== undefined) {
          setCustomerSearchCount(result.customerSearchCount)
        }
      } else {
        alert(result.message || "Customer search failed")
      }
    } catch (error) {
      console.error("搜索客户失败:", error)
      alert("Customer search failed")
    } finally {
      setSearching(false)
    }
  }

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(total / pageSize)) return
    
    if (searchId) {
      // 使用搜索记录获取分页结果
      try {
        const response = await fetch(`/api/market/match-customers?searchId=${searchId}&page=${newPage}&pageSize=${pageSize}`, {
          credentials: "include"
        })
        const result = await response.json()
        if (result.ok && result.data) {
          setMatchedCustomers(result.data)
          setPage(newPage)
          // 更新total状态
          if (result.total !== undefined) {
            setTotal(result.total)
          }
        } else {
          // 如果搜索记录过期，重新搜索并跳转到目标页
          console.log("[Pagination] Search record expired, re-searching...")
          setPage(newPage)
          await handleSearchWithPage(newPage)
        }
      } catch (error) {
        console.log("[Pagination] Error:", error)
        setPage(newPage)
        await handleSearchWithPage(newPage)
      }
    } else {
      // 如果没有searchId，重新搜索
      setPage(newPage)
      await handleSearchWithPage(newPage)
    }
  }
  
  // 带指定页码的搜索
  const handleSearchWithPage = async (targetPage: number) => {
    setSearching(true)
    
    try {
      const requestBody = {
        productCategories,
        certifications,
        industry,
        businessType: selectedBusinessType === 'all' ? '' : selectedBusinessType,
        country: selectedCountry === 'all' ? '' : selectedCountry,
        keywords: searchKeywords.split(',').map(k => k.trim()).filter(k => k),
        page: targetPage,
        pageSize
      }
      
      const response = await fetch("/api/market/match-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      if (result.ok && result.data) {
        setMatchedCustomers(result.data)
        setTotal(result.total || 0)
        setPage(targetPage)
        if (result.searchId) {
          setSearchId(result.searchId)
        }
      } else {
        alert(result.message || "Customer search failed")
      }
    } catch (error) {
      console.error("搜索客户失败:", error)
      alert("Customer search failed")
    } finally {
      setSearching(false)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(1)
    handleSearch(true)
  }

  const handleReset = () => {
    setSearchKeywords('')
    setSelectedBusinessType('')
    setSelectedCountry('')
  }

  const handleEmailClick = async (customer: CustomerMatchResult) => {
    setCurrentCustomer(customer)
    setEmailSubject('')
    setEmailBody('')
    setCurrentDraftId('')
    setEmailSent(false)
    setShowEmailModal(true)
    
    // 先将客户数据保存到数据库
    await saveCustomerToDB(customer.customer)
    
    // 自动生成邮件
    await generateEmail(customer)
  }
  
  // 保存客户到数据库
  const saveCustomerToDB = async (customer: OverseasCustomer) => {
    try {
      const response = await fetch("/api/market/customers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(customer)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (!result.ok) {
        console.warn("[CustomerSave] Failed:", result.message)
      }
    } catch (error: any) {
      console.error("[CustomerSave] Error:", error.message)
    }
  }

  // 加载已保存的客户
  const loadSavedCustomers = async () => {
    setLoadingSavedCustomers(true)
    try {
      const response = await fetch("/api/market/customers/list", {
        method: "GET",
        credentials: "include"
      })
      const result = await response.json()
      if (result.ok) {
        setSavedCustomers(result.data || [])
      }
    } catch (error) {
      console.error("[Frontend] Failed to load saved customers:", error)
    } finally {
      setLoadingSavedCustomers(false)
    }
  }

  // 删除已保存的客户
  const deleteSavedCustomer = async (customerId: string) => {
    if (!confirm("确定要删除这个客户吗？")) return
    
    try {
      const response = await fetch(`/api/market/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include"
      })
      const result = await response.json()
      if (result.ok) {
        setSavedCustomers(prev => prev.filter(c => c.id !== customerId))
      } else {
        alert(result.message || "删除失败")
      }
    } catch (error) {
      console.error("[Frontend] Failed to delete customer:", error)
      alert("删除失败")
    }
  }

  const generateEmail = async (customer: CustomerMatchResult) => {
    setGeneratingEmail(true)
    try {
      const response = await fetch("/api/market/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerId: customer.customer.id,
          customerName: customer.customer.companyName,
          customerEmail: customer.customer.email,
          customerIndustry: customer.customer.industry,
          customerBusinessType: customer.customer.businessType,
          customerProductCategories: customer.customer.productCategories,
          customerCertifications: customer.customer.certifications,
          myProductCategories: productCategories,
          myCertifications: certifications,
          industry: industry
        })
      })

      const result = await response.json()
      if (result.ok) {
        setEmailSubject(result.subject || '')
        setEmailBody(result.body || '')
        setCurrentDraftId(result.draftId || '')
      } else {
        alert(result.message || "Failed to generate email")
      }
    } catch (error) {
      console.error("生成邮件失败:", error)
      alert("Failed to generate email")
    } finally {
      setGeneratingEmail(false)
    }
  }

  const handleSendEmail = async () => {
    if (!currentCustomer || !currentDraftId) return
    
    setSendingEmail(true)
    try {
      // 1. 先将客户数据保存到数据库
      await saveCustomerToDB(currentCustomer.customer)
      
      // 2. 更新草稿内容并提交审核
      const response = await fetch("/api/market/email/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          draftId: currentDraftId,
          subject: emailSubject,
          body: emailBody
        })
      })

      const result = await response.json()
      if (result.ok) {
        setEmailSent(true)
        alert("邮件已提交审核，请等待管理员审核通过后发送")
      } else {
        alert(result.message || "提交审核失败")
      }
    } catch (error) {
      console.error("提交审核失败:", error)
      alert("提交审核失败")
    } finally {
      setSendingEmail(false)
    }
  }

  const handleRegenerateEmail = async () => {
    if (!currentCustomer) return
    await generateEmail(currentCustomer)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Precision Customer Search
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 欢迎横幅 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI Precision Customer Search</h2>
              <p className="text-white/80 text-sm max-w-lg">
                Based on your enterprise digital profile, AI will automatically match and recommend potential overseas customers for you.
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* 精准寻客使用次数提示 */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Customer Search Usage</p>
                <p className="font-semibold text-slate-800">
                  {customerSearchCount} / {MAX_CUSTOMER_SEARCH_COUNT} times used
                </p>
              </div>
            </div>
            <div className="w-48">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    customerSearchCount >= MAX_CUSTOMER_SEARCH_COUNT 
                      ? 'bg-red-500' 
                      : customerSearchCount >= MAX_CUSTOMER_SEARCH_COUNT * 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${(customerSearchCount / MAX_CUSTOMER_SEARCH_COUNT) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">
                {MAX_CUSTOMER_SEARCH_COUNT - customerSearchCount} remaining
              </p>
            </div>
          </div>
        </div>

        {/* 搜索条件卡片 */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b-0 pb-0">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              Search Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 关键词搜索 */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Keywords</label>
                <Input
                  placeholder="Enter keywords separated by comma"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                />
              </div>
              
              {/* 业务类型 */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Business Type</label>
                <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 国家 */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Country</label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 搜索按钮 */}
              <div className="flex items-end gap-2">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
                  onClick={() => handleSearch(true)}
                  disabled={searching}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {searching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Start Search"
                  )}
                </Button>
              </div>
            </div>

            {/* 当前匹配条件展示 */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-500 mb-3">Current Matching Criteria:</p>
              <div className="flex flex-wrap gap-2">
                {productCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-600">Categories:</span>
                    {productCategories.slice(0, 3).map((cat, i) => (
                      <Badge key={i} className="bg-blue-100 text-blue-700">{cat}</Badge>
                    ))}
                    {productCategories.length > 3 && (
                      <span className="text-xs text-slate-400">+{productCategories.length - 3}</span>
                    )}
                  </div>
                )}
                {certifications.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-slate-600">Certifications:</span>
                    {certifications.slice(0, 3).map((cert, i) => (
                      <Badge key={i} className="bg-yellow-100 text-yellow-700">{cert}</Badge>
                    ))}
                    {certifications.length > 3 && (
                      <span className="text-xs text-slate-400">+{certifications.length - 3}</span>
                    )}
                  </div>
                )}
                {industry && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-500" />
                    <Badge className="bg-purple-100 text-purple-700">{industry}</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 搜索结果 */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b-0 pb-0">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Matching Results
              {matchedCustomers.length > 0 && (
                <Badge className="bg-indigo-500 text-white">{matchedCustomers.length} matches</Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadSavedCustomers()
                  setShowSavedCustomers(true)
                }}
                className="ml-auto bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Building2 className="w-4 h-4 mr-2" />
                已保存客户
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {searching ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
                <p className="text-slate-500">AI is searching for matching customers...</p>
              </div>
            ) : matchedCustomers.length > 0 ? (
              <>
                <div className="space-y-4">
                  {matchedCustomers.map((match, index) => (
                  <div
                    key={match.customer.id}
                    className="p-6 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-slate-800">
                            {match.customer.companyName}
                          </h4>
                          <Badge 
                            className={`${
                              match.matchScore >= 40 ? 'bg-green-500' : 
                              match.matchScore >= 20 ? 'bg-yellow-500' : 'bg-orange-500'
                            } text-white`}
                          >
                            Match: {match.matchScore}%
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">{match.customer.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-4 h-4 text-indigo-500" />
                            <span>{match.customer.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Briefcase className="w-4 h-4 text-indigo-500" />
                            <span>{match.customer.businessType}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-4 h-4 text-indigo-500" />
                            <span>{match.customer.phone}</span>
                          </div>
                        </div>

                        {/* 匹配的品类和认证 */}
                        {match.matchedCategories.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-slate-500 mb-1">Matched Categories:</p>
                            <div className="flex flex-wrap gap-1">
                              {match.matchedCategories.map((cat, i) => (
                                <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {match.matchedCertifications.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-slate-500 mb-1">Matched Certifications:</p>
                            <div className="flex flex-wrap gap-1">
                              {match.matchedCertifications.map((cert, i) => (
                                <Badge key={i} variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        {match.customer.email && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
                            onClick={() => handleEmailClick(match)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                        )}
                        {match.customer.website && (
                          <a
                            href={match.customer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 分页组件 */}
              {total > pageSize && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total} results
                    </span>
                    <Select value={String(pageSize)} onValueChange={(v) => handlePageSizeChange(Number(v))}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 per page</SelectItem>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={page === pageNum ? "bg-indigo-500" : ""}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= Math.ceil(total / pageSize)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-700 mb-2">No Matching Customers Found</h4>
                <p className="text-slate-500 mb-4">Try adjusting your search criteria or upload a product catalog to get better matches.</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReset()
                    handleSearch()
                  }}
                  className="border-indigo-300 text-indigo-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset and Search Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 邮件发送弹窗 */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              {emailSent ? 'Email Sent Successfully!' : 'AI Generated Email'}
            </DialogTitle>
          </DialogHeader>
          
          {emailSent ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-medium text-slate-800 mb-2">Email sent successfully!</p>
              <p className="text-slate-500">The email has been sent to {currentCustomer?.customer.email}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 客户信息 */}
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-600">Sending to:</p>
                <p className="font-medium text-indigo-800">{currentCustomer?.customer.companyName}</p>
                <p className="text-sm text-indigo-600">{currentCustomer?.customer.email}</p>
              </div>

              {/* 邮件主题 */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Subject</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  disabled={generatingEmail}
                  placeholder="Email subject"
                />
              </div>

              {/* 邮件正文 */}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Email Body</label>
                <div className="relative">
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    disabled={generatingEmail}
                    placeholder="Email content..."
                    className="min-h-[200px]"
                  />
                  {generatingEmail && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* 操作提示 */}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <AlertCircle className="w-4 h-4" />
                <span>Email will be sent via our proxy email service for privacy protection</span>
              </div>
            </div>
          )}

          <DialogFooter>
            {emailSent ? (
            <Button onClick={() => setShowEmailModal(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleRegenerateEmail}
                  disabled={generatingEmail}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Regenerate
                </Button>
                <Button
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailSubject || !emailBody}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 已保存客户弹窗 */}
      <Dialog open={showSavedCustomers} onOpenChange={setShowSavedCustomers}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              已保存客户 ({savedCustomers.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4">
            {loadingSavedCustomers ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : savedCustomers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">暂无已保存的客户</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800">{customer.companyName}</h4>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{customer.location}</span>
                            </div>
                          )}
                          {customer.businessType && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{customer.businessType}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>
                        {customer.description && (
                          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{customer.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => deleteSavedCustomer(customer.id)}
                      >
                        <X className="w-4 h-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSavedCustomers(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
