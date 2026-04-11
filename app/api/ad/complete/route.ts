import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest, parseAmount, formatAmount } from "@/lib/api-utils"
import { dbAdapter } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADS_TABLE = "acquisition_ads"
const PARTICIPATIONS_TABLE = "ad_participations"
const PROFILES_TABLE = "user_market_profiles"
const TRANSACTIONS_TABLE = "user_transactions"

function ok(message: string, data?: any) {
  return NextResponse.json({ ok: true, message, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    const body = await request.json()
    const { adId } = body
    if (!adId) return fail("adId 不能为空")

    // 查广告
    let adRows = await dbAdapter.loadRows(ADS_TABLE, { id: adId })
    if (!adRows.length) adRows = await dbAdapter.loadRows(ADS_TABLE, { _id: adId })
    if (!adRows.length) return fail("广告不存在", 404)
    const ad = adRows[0]

    // 查参与记录
    let participation = await dbAdapter.loadSingleRow(PARTICIPATIONS_TABLE, { userId, adId })

    if (participation?.status === "已完成") {
      return fail("该任务已完成，不能重复结算")
    }

    const reward = parseAmount(ad.reward || "0")
    if (reward <= 0) return fail("广告奖励金额无效")

    // 没有参与记录则自动创建
    if (!participation) {
      participation = await dbAdapter.insertRow(PARTICIPATIONS_TABLE, {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId,
        adId,
        status: "进行中",
        rewardEarned: formatAmount(reward),
      })
    }

    const participationId = participation.id || participation._id

    // 更新参与记录为已完成
    await dbAdapter.updateRow(
      PARTICIPATIONS_TABLE,
      { id: participationId },
      {
        status: "已完成",
        rewardEarned: formatAmount(reward),
        completedAt: new Date().toISOString(),
      }
    )

    // 获取或初始化用户钱包
    let profile = await dbAdapter.loadSingleRow(PROFILES_TABLE, { id: userId })
    if (!profile) {
      profile = await dbAdapter.insertRow(PROFILES_TABLE, {
        id: userId,
        balance: "0",
        totalEarnings: "0",
        adViewsCount: 0,
        isRealNameVerified: false,
        isInfluencerVerified: false,
        isMerchantVerified: false,
      })
    }

    const newBalance = parseAmount(profile.balance || "0") + reward
    const newEarnings = parseAmount(profile.totalEarnings || "0") + reward
    const newViews = (profile.adViewsCount || 0) + 1

    // 更新余额
    await dbAdapter.updateRow(PROFILES_TABLE, { id: userId }, {
      balance: formatAmount(newBalance),
      totalEarnings: formatAmount(newEarnings),
      adViewsCount: newViews,
    })

    // 写流水
    await dbAdapter.insertRow(TRANSACTIONS_TABLE, {
      userId,
      type: "reward",
      amount: formatAmount(reward),
      balance: formatAmount(newBalance),
      orderId: adId,
      status: "success",
      remark: `广告任务奖励：${ad.brand || adId}`,
    })

    // 广告观看数 +1
    const currentViews = parseInt(String(ad.views || "0"), 10)
    await dbAdapter.updateRow(ADS_TABLE, { id: adId }, {
      views: String(currentViews + 1),
    }).catch(() => {}) // 非关键操作，失败不影响结算

    return ok("奖励已到账", {
      reward: formatAmount(reward),
      newBalance: formatAmount(newBalance),
      newTotalEarnings: formatAmount(newEarnings),
    })
  } catch (error: any) {
    console.error("[ad/complete]", error)
    return fail(error?.message || "结算失败，请重试", 500)
  }
}
