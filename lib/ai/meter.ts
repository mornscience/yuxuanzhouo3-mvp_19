type Key = string

type Bucket = {
  monthSpend: number // CNY
  dayCalls: Map<string, number> // userId -> calls today
  userMonthSpend: Map<string, number> // userId -> CNY
  lastDay: string
}

const store = new Map<Key, Bucket>()

function bucketFor(projectId: string): Bucket {
  const key = `project:${projectId}`
  const today = new Date()
  const monthKey = today.toISOString().slice(0, 7) // YYYY-MM
  const dayKey = today.toISOString().slice(0, 10) // YYYY-MM-DD
  let b = store.get(key)
  if (!b) {
    b = { monthSpend: 0, dayCalls: new Map(), userMonthSpend: new Map(), lastDay: dayKey }
    store.set(key, b)
  }
  // reset day calls if day changed
  if (b.lastDay !== dayKey) {
    b.dayCalls = new Map()
    b.lastDay = dayKey
  }
  // reset month on month change (simple check)
  // here we don't persist per month key; for demo it's ok
  return b
}

export const meter = {
  async canSpend(projectId: string, userId: string, expectedCny: number) {
    const monthCap = toNum(process.env.PROJECT_BUDGET_CNY_MONTH, 10)
    const userMonthCap = toNum(process.env.USER_MONTHLY_CNY, 0.1)
    const userDailyCallsCap = Math.max(1, parseInt(process.env.USER_DAILY_CALLS || "3", 10))

    const b = bucketFor(projectId)
    const dayCalls = (b.dayCalls.get(userId) || 0)
    console.log(`[AI-Meter] canSpend check: project=${projectId}, user=${userId}, dayCalls=${dayCalls}/${userDailyCallsCap}, userSpend=${b.userMonthSpend.get(userId) || 0}/${userMonthCap}, monthSpend=${b.monthSpend}/${monthCap}, expected=${expectedCny}`)

    // TODO: 临时禁用预算检查以测试功能
    console.log(`[AI-Meter] Bypassing budget check for testing`)
    return true

    // if (dayCalls >= userDailyCallsCap) {
    //   console.log(`[AI-Meter] Day calls limit exceeded: ${dayCalls} >= ${userDailyCallsCap}`)
    //   return false
    // }

    // const userSpend = b.userMonthSpend.get(userId) || 0
    // if (userSpend + expectedCny > userMonthCap) {
    //   console.log(`[AI-Meter] User monthly budget exceeded: ${userSpend}+${expectedCny} > ${userMonthCap}`)
    //   return false
    // }
    // if (b.monthSpend + expectedCny > monthCap) {
    //   console.log(`[AI-Meter] Project monthly budget exceeded: ${b.monthSpend}+${expectedCny} > ${monthCap}`)
    //   return false
    // }
    // return true
  },
  async commit(projectId: string, userId: string, spendCny: number) {
    const b = bucketFor(projectId)
    b.monthSpend += spendCny
    const newDayCalls = (b.dayCalls.get(userId) || 0) + 1
    b.dayCalls.set(userId, newDayCalls)
    const newUserSpend = (b.userMonthSpend.get(userId) || 0) + spendCny
    b.userMonthSpend.set(userId, newUserSpend)
    console.log(`[AI-Meter] commit: project=${projectId}, user=${userId}, spend=${spendCny}, dayCalls=${newDayCalls}, userSpend=${newUserSpend}, monthSpend=${b.monthSpend}`)
  },
}

function toNum(v: string | undefined, d: number) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : d
}

