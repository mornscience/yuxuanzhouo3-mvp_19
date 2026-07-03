import { NextResponse } from "next/server"
import { searchCustomers } from "@/lib/market/customer-search"
import { CustomerSearchParams, CustomerSearchResult } from "@/lib/market/customer-types"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const params: CustomerSearchParams = {
      productCategories: body.productCategories,
      industry: body.industry,
      country: body.country,
      city: body.city,
      businessType: body.businessType,
      certifications: body.certifications,
      keywords: body.keywords
    }
    
    const results = await searchCustomers(params)
    
    const response: CustomerSearchResult = {
      ok: true,
      data: results.results.map(r => r.customer),
      total: results.total
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Customer search error:", error)
    return NextResponse.json({
      ok: false,
      message: "Internal server error",
      data: [],
      total: 0
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const results = await searchCustomers({})
    
    const response: CustomerSearchResult = {
      ok: true,
      data: results.results.map(r => r.customer),
      total: results.total
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Get all customers error:", error)
    return NextResponse.json({
      ok: false,
      message: "Internal server error",
      data: [],
      total: 0
    }, { status: 500 })
  }
}