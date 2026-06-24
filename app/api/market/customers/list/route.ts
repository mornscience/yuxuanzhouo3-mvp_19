import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAuth } from "@/lib/api-utils"

export async function GET(request: Request) {
  try {
    const userId = requireAuth(request as any)
    
    // 获取所有已保存的客户
    const customers = await dbAdapter.loadRows("overseas_customers")
    
    // 转换字段名称（从snake_case到camelCase）
    // 注意：PostgreSQL 的 TEXT[] 类型在 Supabase 中已经自动转换为 JavaScript 数组
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      companyName: customer.company_name || customer.companyName || "",
      companyNameEn: customer.company_name_en || customer.companyNameEn || "",
      industry: customer.industry || "",
      subIndustry: customer.sub_industry || customer.subIndustry || "",
      location: customer.location || "",
      country: customer.country || "",
      city: customer.city || "",
      contactPerson: customer.contact_person || customer.contactPerson || "",
      email: customer.email || "",
      phone: customer.phone || "",
      website: customer.website || "",
      businessType: customer.business_type || customer.businessType || "",
      annualRevenue: customer.annual_revenue || customer.annualRevenue || "",
      employeeCount: customer.employee_count || customer.employeeCount || "",
      foundedYear: customer.founded_year || customer.foundedYear || 0,
      productCategories: Array.isArray(customer.product_categories) 
        ? customer.product_categories 
        : (customer.product_categories ? JSON.parse(customer.product_categories) : []),
      certifications: Array.isArray(customer.certifications) 
        ? customer.certifications 
        : (customer.certifications ? JSON.parse(customer.certifications) : []),
      description: customer.description || "",
      source: customer.source || "",
      createdAt: customer.created_at || customer.createdAt || "",
      updatedAt: customer.updated_at || customer.updatedAt || ""
    }))

    // 按创建时间排序
    formattedCustomers.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      ok: true,
      data: formattedCustomers
    })

  } catch (error: any) {
    console.error("[API] Failed to load customers:", error)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to load customers"
    }, { status: 500 })
  }
}