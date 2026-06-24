import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { searchCustomers, saveSearchRecord, getSearchResults, cleanupExpiredSearches } from "@/lib/market/customer-search"
import { dbAdapter } from "@/lib/market/db-adapter"

const MAX_CUSTOMER_SEARCH_COUNT = 60 // 精准寻客次数上限

export async function POST(request: Request) {
  try {
    const userId = requireAuth(request)
    
    // 调试日志
    console.log("[API] match-customers POST request received, userId:", userId)
    
    // 检查用户企业认证状态和精准寻客次数
    const profileRows = await dbAdapter.loadRows("user_market_profiles", { id: userId })
    if (profileRows.length === 0) {
      return Response.json({ ok: false, message: "User profile not found" }, { status: 404 })
    }
    
    const profile = profileRows[0]
    const isMerchantVerified = !!(profile?.isMerchantVerified ?? profile?.is_merchant_verified)
    const customerSearchCount = Number(profile?.customerSearchCount ?? profile?.customer_search_count ?? 0)
    const isPremium = !!(profile?.is_premium ?? profile?.isPremium ?? false)
    const premiumExpiresAt = profile?.premium_expires_at
    
    // 检查企业认证状态
    if (!isMerchantVerified) {
      return Response.json({ ok: false, message: "Please complete enterprise verification first" }, { status: 403 })
    }
    
    // 检查使用次数
    if (customerSearchCount >= MAX_CUSTOMER_SEARCH_COUNT) {
      return Response.json({ ok: false, message: `Customer search limit reached (${MAX_CUSTOMER_SEARCH_COUNT} times)` }, { status: 403 })
    }
    
    const body = await request.json()
    
    // 调试日志
    console.log("[API] match-customers request body:", JSON.stringify(body, null, 2))
    
    const params = {
      productCategories: body.productCategories as string[] || [],
      industry: body.industry as string || '',
      country: body.country as string || '',
      city: body.city as string || '',
      businessType: body.businessType as string || '',
      certifications: body.certifications as string[] || [],
      keywords: body.keywords as string[] || []
    }
    
    // 获取分页参数
    const page = Number(body.page) || 1
    const pageSize = Number(body.pageSize) || 10
    
    // 调试日志
    console.log("[API] match-customers search params:", JSON.stringify(params, null, 2))
    console.log("[API] match-customers pagination: page=", page, "pageSize=", pageSize)
    
    // 搜索客户（根据会员状态选择模型）
    const { results, total, allCustomerIds } = await searchCustomers(params, page, pageSize, isPremium)
    
    // 调试日志
    console.log("[API] match-customers search completed: total=", total, "returned=", results.length)
    
    // 保存搜索记录（仅在第一页时保存）
    let searchId: string | null = null
    if (page === 1) {
      searchId = await saveSearchRecord(userId, params, allCustomerIds)
      
      // 使用次数递增
      await dbAdapter.updateRow("user_market_profiles", { id: userId }, {
        customerSearchCount: customerSearchCount + 1,
        customer_search_count: customerSearchCount + 1
      })
    }
    
    return NextResponse.json({
      ok: true,
      message: "Success",
      data: results,
      total,
      page,
      pageSize,
      searchId,
      customerSearchCount: customerSearchCount + (page === 1 ? 1 : 0),
      customerSearchLimit: MAX_CUSTOMER_SEARCH_COUNT,
      isPremium,
      premiumExpiresAt,
    })
  } catch (error: any) {
    console.error("Customer match error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Internal server error",
      data: [],
      total: 0
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const searchId = searchParams.get('searchId')
    const page = Number(searchParams.get('page')) || 1
    const pageSize = Number(searchParams.get('pageSize')) || 10
    
    if (!searchId) {
      return NextResponse.json({ ok: false, message: "searchId is required" }, { status: 400 })
    }
    
    // 获取分页结果
    const result = await getSearchResults(searchId, page, pageSize)
    
    if (!result) {
      return NextResponse.json({ ok: false, message: "Search record not found or expired" }, { status: 404 })
    }
    
    return NextResponse.json({
      ok: true,
      message: "Success",
      data: result.results,
      total: result.total,
      page,
      pageSize,
      searchId
    })
  } catch (error: any) {
    console.error("Get search results error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Internal server error",
      data: [],
      total: 0
    }, { status: 500 })
  }
}

// 定期清理过期搜索记录（可以通过定时任务调用）
export async function DELETE(request: Request) {
  try {
    // 只有管理员可以调用此接口
    const userId = requireAuth(request)
    
    await cleanupExpiredSearches()
    
    return NextResponse.json({
      ok: true,
      message: "Expired searches cleaned up successfully"
    })
  } catch (error: any) {
    console.error("Cleanup error:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Internal server error"
    }, { status: 500 })
  }
}
