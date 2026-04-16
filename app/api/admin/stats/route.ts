import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { createClient } from "@supabase/supabase-js"

function getSb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const sb = getSb()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [{ count: totalUsers }, { count: newUsersToday }, { count: paidUsers }, { count: totalOrders }, { count: monthOrders }] = await Promise.all([
      sb.from("users").select("*", { count: "exact", head: true }),
      sb.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      sb.from("user_market_profiles").select("*", { count: "exact", head: true }).gt("balance", 0),
      sb.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid"),
      sb.from("orders").select("*", { count: "exact", head: true }).eq("status", "paid").gte("created_at", monthStart),
    ])

    const { data: revenueData } = await sb.from("orders").select("amount").eq("status", "paid")
    const totalRevenue = (revenueData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)

    const { data: monthRevenueData } = await sb.from("orders").select("amount").eq("status", "paid").gte("created_at", monthStart)
    const monthRevenue = (monthRevenueData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)

    const conversionRate = totalUsers ? ((paidUsers || 0) / totalUsers * 100).toFixed(1) : "0"

    return NextResponse.json({
      ok: true,
      data: { totalUsers, newUsersToday, paidUsers, totalOrders, monthOrders, totalRevenue, monthRevenue, conversionRate }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
