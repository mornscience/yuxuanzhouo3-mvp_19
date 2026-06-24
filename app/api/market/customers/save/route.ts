import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/market/db-adapter"
import { requireAuth } from "@/lib/api-utils"

export async function POST(request: Request) {
  try {
    const userId = requireAuth(request as any)
    const customer = await request.json()
    
    const existingRows = await dbAdapter.loadRows("overseas_customers", { 
      email: customer.email 
    })
    
    const productCategoriesArray = customer.productCategories || customer.product_categories || []
    const certificationsArray = customer.certifications || []
    const socialLinksArray = customer.socialLinks || customer.social_links || []
    
    const allowedSources = ['yellow_pages', 'linkedin', 'exhibition', 'trade_portal', 'other']
    const sourceValue = allowedSources.includes(customer.source?.toLowerCase()) 
      ? customer.source.toLowerCase() 
      : "other"
    
    const customerData = {
      company_name: customer.companyName || customer.company_name || "",
      company_name_en: customer.companyNameEn || customer.company_name_en || "",
      industry: customer.industry || "",
      sub_industry: customer.subIndustry || customer.sub_industry || "",
      location: customer.location || "",
      country: customer.country || "",
      city: customer.city || "",
      contact_person: customer.contactPerson || customer.contact_person || "",
      phone: customer.phone || "",
      website: customer.website || "",
      social_links: socialLinksArray,
      business_type: (customer.businessType || customer.business_type || "").toLowerCase(),
      annual_revenue: customer.annualRevenue || customer.annual_revenue || "",
      employee_count: customer.employeeCount || customer.employee_count || "",
      founded_year: customer.foundedYear || customer.founded_year || null,
      product_categories: productCategoriesArray,
      certifications: certificationsArray,
      description: customer.description || "",
      source: sourceValue,
      updated_at: new Date().toISOString()
    }
    
    if (existingRows.length > 0) {
      const existingId = existingRows[0].id
      await dbAdapter.updateRow("overseas_customers", { id: existingId }, customerData)
      
      return NextResponse.json({
        ok: true,
        message: "Customer updated",
        customerId: existingId
      })
    } else {
      const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      
      await dbAdapter.insertRow("overseas_customers", {
        id: customerId,
        ...customerData,
        email: customer.email || "",
        created_at: new Date().toISOString()
      })
      
      return NextResponse.json({
        ok: true,
        message: "Customer saved",
        customerId: customerId
      })
    }
  } catch (error: any) {
    console.error("[CustomerSaveAPI] Error:", error.message)
    return NextResponse.json({
      ok: false,
      message: error.message || "Failed to save customer"
    }, { status: 500 })
  }
}
