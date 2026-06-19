import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/market/db-adapter"

export async function PUT(request: NextRequest) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { productCategories, capacity, priceRange, qualityCertifications, otherTags } = body

    // 更新用户资料，存储解析结果
    const updateData: Record<string, any> = {}
    
    if (productCategories) {
      updateData.product_categories = JSON.stringify(productCategories)
    }
    if (capacity) {
      updateData.capacity = capacity
    }
    if (priceRange) {
      updateData.price_range = priceRange
    }
    if (qualityCertifications) {
      updateData.quality_certifications = JSON.stringify(qualityCertifications)
    }
    if (otherTags) {
      updateData.other_tags = JSON.stringify(otherTags)
    }

    // 添加数字画像更新时间
    updateData.digital_portrait_updated_at = new Date().toISOString()

    const result = await dbAdapter.updateRow("user_market_profiles", { user_id: userId }, updateData)
    
    return Response.json({
      ok: true,
      message: "企业数字画像保存成功"
    })
  } catch (error: any) {
    console.error("[API] 更新商家资料失败:", error)
    return Response.json(
      { ok: false, message: error.message || "保存失败" },
      { status: 500 }
    )
  }
}