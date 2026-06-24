"use client"

import { useState, useEffect } from "react"
import { Upload, FileText, Sparkles, CheckCircle, Loader2, X, Building2, Tag, TrendingUp, DollarSign, Award, ChevronRight, Search, Users, MapPin, Briefcase, Phone, Mail, Globe, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { UserMarketProfile } from "@/lib/market/acquisition-types"
import type { OverseasCustomer, CustomerMatchResult } from "@/lib/market/customer-types"

interface ParsedData {
  productCategories: string[]
  capacity: string
  priceRange: string
  qualityCertifications: string[]
  otherTags: string[]
}

const MAX_PDF_ANALYSIS_COUNT = 20
const MAX_CUSTOMER_SEARCH_COUNT = 60

export function MerchantVerifyDetail() {
  const [profile, setProfile] = useState<UserMarketProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [message, setMessage] = useState("")
  const [aiUsageCount, setAiUsageCount] = useState(0)
  
  // 客户搜索相关状态
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [matchedCustomers, setMatchedCustomers] = useState<CustomerMatchResult[]>([])
  const [showCustomers, setShowCustomers] = useState(false)

  // 加载企业信息
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // 首先尝试从专门的商家信息 API 获取详细信息
      const merchantInfoResponse = await fetch("/api/profile/merchant-info", { credentials: "include" })
      const merchantInfoJson = await merchantInfoResponse.json()
      
      if (merchantInfoJson.ok && merchantInfoJson.data) {
        setProfile(merchantInfoJson.data)
        setAiUsageCount(Number(merchantInfoJson.data.aiUsageCount ?? merchantInfoJson.data.ai_usage_count ?? 0))
        return
      }
      
      // 如果没有找到，尝试从通用 profile API 获取
      const profileResponse = await fetch("/api/market/admin/acquisition", { credentials: "include" })
      const profileJson = await profileResponse.json()
      
      if (profileJson.success && profileJson.data?.profile) {
        setProfile(profileJson.data.profile)
        setAiUsageCount(Number(profileJson.data.profile.aiUsageCount ?? profileJson.data.profile.ai_usage_count ?? 0))
      }
    } catch (error) {
      console.error("加载企业信息失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setMessage("请上传PDF格式文件")
        return
      }
      if (file.size > 60 * 1024 * 1024) {
        setMessage("文件大小不能超过60MB")
        return
      }
      setUploadedFile(file)
      setMessage("")
    }
  }

  // AI 解析 PDF
  const handleParse = async () => {
    if (!uploadedFile) {
      setMessage("Please upload a PDF file first")
      return
    }

    setParsing(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)
      formData.append("type", "merchant_profile")

      const response = await fetch("/api/ai/parse-pdf", {
        method: "POST",
        body: formData,
        credentials: "include"
      })

      const result = await response.json()
      if (result.ok && result.data) {
        setParsedData(result.data)
        // 更新 AI 使用次数
        if (result.aiUsageCount !== undefined) {
          setAiUsageCount(result.aiUsageCount)
        }
        setMessage("Analysis completed, saving to database...")
        
        // 自动保存到数据库
        try {
          const saveResponse = await fetch("/api/profile/update-merchant-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(result.data)
          })
          
          const saveResult = await saveResponse.json()
          if (saveResult.ok) {
            setMessage("Analysis completed and saved to database!")
            // 重新加载企业信息以显示最新数据
            await loadProfile()
          } else {
            setMessage("Analysis completed but save failed: " + (saveResult.message || "Unknown error"))
          }
        } catch (saveError) {
          console.error("自动保存失败:", saveError)
          setMessage("Analysis completed but auto-save failed. Please click 'Save Digital Profile' button.")
        }
      } else {
        setMessage(result.message || "Analysis failed")
      }
    } catch (error) {
      console.error("解析失败:", error)
      setMessage("Analysis failed, please try again")
    } finally {
      setParsing(false)
    }
  }

  // 保存解析结果
  const handleSave = async () => {
    if (!parsedData) return

    try {
      const response = await fetch("/api/profile/update-merchant-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsedData)
      })

      const result = await response.json()
      if (result.ok) {
        setMessage("Saved successfully!")
      } else {
        setMessage(result.message || "Save failed")
      }
    } catch (error) {
      console.error("保存失败:", error)
      setMessage("Save failed")
    }
  }

  // 搜索海外客户
  const handleSearchCustomers = async () => {
    const dataToUse = parsedData || {
      productCategories: profile?.product_categories ? JSON.parse(profile.product_categories) : [],
      qualityCertifications: profile?.quality_certifications ? JSON.parse(profile.quality_certifications) : [],
      industry: profile?.industry || ''
    }

    setSearchingCustomers(true)
    setShowCustomers(true)

    try {
      const response = await fetch("/api/market/match-customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productCategories: dataToUse.productCategories,
          certifications: dataToUse.qualityCertifications,
          industry: dataToUse.industry
        })
      })

      const result = await response.json()
      if (result.ok && result.data) {
        setMatchedCustomers(result.data)
      } else {
        setMessage(result.message || "Customer search failed")
      }
    } catch (error) {
      console.error("搜索客户失败:", error)
      setMessage("Customer search failed")
    } finally {
      setSearchingCustomers(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  // 统一获取字段值，支持 camelCase 和 snake_case
  const getFieldValue = (field: string) => {
    if (!profile) return "-"
    // 尝试 snake_case
    if (profile[field as keyof UserMarketProfile] !== undefined) {
      return profile[field as keyof UserMarketProfile] || "-"
    }
    // 尝试 camelCase
    const camelCaseField = field.split('_').map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
    if (profile[camelCaseField as keyof UserMarketProfile] !== undefined) {
      return profile[camelCaseField as keyof UserMarketProfile] || "-"
    }
    return "-"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              Enterprise Digital Profile
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 欢迎横幅 */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Enterprise Digital Profile</h2>
              <p className="text-white/80 text-sm max-w-lg">
                Upload your product catalog PDF and AI will automatically analyze it to extract key business insights.
              </p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* AI 使用次数提示 */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">PDF Analysis Usage</p>
                <p className="font-semibold text-slate-800">
                  {aiUsageCount} / {MAX_PDF_ANALYSIS_COUNT} times used
                </p>
              </div>
            </div>
            <div className="w-48">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    aiUsageCount >= MAX_PDF_ANALYSIS_COUNT 
                      ? 'bg-red-500' 
                      : aiUsageCount >= MAX_PDF_ANALYSIS_COUNT * 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500'
                  }`}
                  style={{ width: `${(aiUsageCount / MAX_PDF_ANALYSIS_COUNT) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">
                {MAX_PDF_ANALYSIS_COUNT - aiUsageCount} remaining
              </p>
            </div>
          </div>
        </div>

        {/* AI精准寻客按钮 */}
        <div className="mb-6">
          <a href="/market/acquisition/ai-customer-search">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              AI Precision Customer Search
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>

        {/* 企业基本信息 */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b-0 pb-0">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company Name</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-800">{getFieldValue('company_name')}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Brand Name</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-800">{getFieldValue('brand_name')}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300 lg:col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Company Website</span>
                  <ExternalLink className="w-4 h-4 text-slate-300" />
                </div>
                <a 
                  href={getFieldValue('company_website')} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline break-all"
                >
                  {getFieldValue('company_website') || '-'}
                </a>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Person</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-800">{getFieldValue('contact_person')}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contact Phone</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-800">{getFieldValue('contact_phone')}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Credit Code</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-mono text-slate-800">{getFieldValue('credit_code')}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Industry</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-lg font-semibold text-slate-800">{getFieldValue('industry')}</p>
              </div>
            </div>

            {/* 营业执照区域 */}
            <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Business License</h4>
                  <p className="text-slate-600 text-sm">
                    Business license photos are not displayed on this page for security reasons. 
                    Please contact admin if you need to view or update your business license.
                  </p>
                </div>
              </div>
            </div>

            {/* 数字画像区域 - 显示已保存的解析结果 */}
            {(profile?.product_categories || profile?.capacity || profile?.price_range || profile?.quality_certifications) && (
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">Digital Profile (AI Analyzed)</h4>
                    <p className="text-xs text-slate-500">
                      {profile.digital_portrait_updated_at 
                        ? `Last updated: ${new Date(profile.digital_portrait_updated_at).toLocaleString()}`
                        : "Extracted from product catalog"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 产品品类 */}
                  {profile.product_categories && (
                    <div className="p-4 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700">Product Categories</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          try {
                            const cats = JSON.parse(profile.product_categories)
                            return cats.map((cat: string, i: number) => (
                              <Badge key={i} className="bg-blue-500 text-white text-xs">{cat}</Badge>
                            ))
                          } catch { return <span className="text-slate-500 text-sm">{profile.product_categories}</span> }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* 产能规模 */}
                  {profile.capacity && (
                    <div className="p-4 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-slate-700">Production Capacity</span>
                      </div>
                      <p className="text-lg font-semibold text-green-600">{profile.capacity}</p>
                    </div>
                  )}
                  
                  {/* 价格区间 */}
                  {profile.price_range && (
                    <div className="p-4 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-slate-700">Price Range</span>
                      </div>
                      <p className="text-lg font-semibold text-orange-600">{profile.price_range}</p>
                    </div>
                  )}
                  
                  {/* 质量认证 */}
                  {profile.quality_certifications && (
                    <div className="p-4 bg-white/60 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-slate-700">Quality Certifications</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          try {
                            const certs = JSON.parse(profile.quality_certifications)
                            return certs.map((cert: string, i: number) => (
                              <Badge key={i} className="bg-yellow-500 text-white text-xs">{cert}</Badge>
                            ))
                          } catch { return <span className="text-slate-500 text-sm">{profile.quality_certifications}</span> }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 其他标签 */}
                {profile.other_tags && (
                  <div className="mt-4 p-4 bg-white/60 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-slate-700">Other Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const tags = JSON.parse(profile.other_tags)
                          return tags.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="border-purple-300 text-purple-600 text-xs">{tag}</Badge>
                          ))
                        } catch { return <span className="text-slate-500 text-sm">{profile.other_tags}</span> }
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* PDF 上传区域 */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b-0 pb-0">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Upload Product Catalog & AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* 上传区域 */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Drop PDF File Here</h3>
              <p className="text-slate-500 mb-6">Click or drag to upload your product catalog PDF</p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
              />
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                onClick={() => document.getElementById("pdf-upload")?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <p className="text-xs text-slate-400 mt-2">Supported format: PDF, max 50 pages / 60MB</p>
            </div>

            {/* 已上传文件 */}
            {uploadedFile && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* 消息提示 */}
            {message && (
              <div className={`mt-6 p-4 rounded-xl ${message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {message}
              </div>
            )}

            {/* 解析按钮 */}
            <Button
              size="lg"
              className="mt-6 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white"
              onClick={handleParse}
              disabled={!uploadedFile || parsing}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {parsing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI Analyzing...
                </>
              ) : (
                "Start AI Analysis"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* AI 解析结果 */}
        {parsedData && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b-0 pb-0">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 产品品类 */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Product Categories</h4>
                      <p className="text-xs text-slate-500">AI identified product categories</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.productCategories.map((category, index) => (
                      <Badge key={index} className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 border-0">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* 产能规模 */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Production Capacity</h4>
                      <p className="text-xs text-slate-500">Estimated production capacity</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{parsedData.capacity}</p>
                </div>

                {/* 价格区间 */}
                <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Price Range</h4>
                      <p className="text-xs text-slate-500">Price range analysis</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{parsedData.priceRange}</p>
                </div>

                {/* 质量认证 */}
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Quality Certifications</h4>
                      <p className="text-xs text-slate-500">Identified quality certifications</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.qualityCertifications.map((cert, index) => (
                      <Badge key={index} className="px-4 py-2 bg-yellow-500 text-white hover:bg-yellow-600 border-0">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* 其他标签 */}
              {parsedData.otherTags && parsedData.otherTags.length > 0 && (
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Additional Tags</h4>
                      <p className="text-xs text-slate-500">Other relevant tags identified</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.otherTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="px-4 py-2 border-purple-300 text-purple-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 保存按钮 */}
              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                  onClick={handleSave}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Save Digital Profile
                </Button>
              </div>

              {/* 搜索客户按钮 */}
              <div className="mt-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400"
                  onClick={handleSearchCustomers}
                  disabled={searchingCustomers}
                >
                  <Search className="w-5 h-5 mr-2" />
                  {searchingCustomers ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching Customers...
                    </>
                  ) : (
                    "Search for Overseas Customers"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 海外客户搜索结果 */}
        {showCustomers && (
          <Card className="border-0 shadow-lg mt-6">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b-0 pb-0">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Matched Overseas Customers
                {matchedCustomers.length > 0 && (
                  <Badge className="bg-indigo-500 text-white">{matchedCustomers.length} matches</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {searchingCustomers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : matchedCustomers.length > 0 ? (
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
                            <a
                              href={`mailto:${match.customer.email}`}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              <span className="text-sm">Contact</span>
                            </a>
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
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-slate-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">No Matching Customers Found</h4>
                  <p className="text-slate-500">Try uploading a product catalog or adjusting your search criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}