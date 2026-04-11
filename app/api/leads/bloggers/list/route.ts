import { NextRequest } from "next/server"
import { requireAuth, successResponse, handleApiError } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const ACQUISITION_BLOGGERS_TABLE = "acquisition_bloggers"

export async function GET(request: NextRequest) {
  try {
    // 验证登录（商家查看需要登录）
    requireAuth(request)

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // 获取所有达人线索（商家可以看到所有达人）
    const bloggers = await dbAdapter.loadRows(ACQUISITION_BLOGGERS_TABLE, {})

    // 简单分页
    const paginatedBloggers = bloggers.slice(skip, skip + limit)

    return successResponse("获取达人列表成功", {
      data: paginatedBloggers,
      pagination: {
        page,
        limit,
        total: bloggers.length,
        totalPages: Math.ceil(bloggers.length / limit)
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}