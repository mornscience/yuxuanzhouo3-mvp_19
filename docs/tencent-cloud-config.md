# mornbusiness 数据库表结构 & API 接口文档

> 数据库路由：`NEXT_PUBLIC_SITE_REGION=cn` → 腾讯云 CloudBase；其他 → Supabase
> 统一返回格式：`{ ok: boolean, message: string, data?: any }`
> 登录凭证：Cookie `market_user_id`（登录后由服务端 Set-Cookie 写入）

---

## 一、数据库表结构

### 1. `users` — 用户账号表

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` / `id` | string | 主键（CloudBase 自动生成 `_id`） |
| `email` | string | 登录邮箱，唯一（第三方登录用占位邮箱） |
| `password` | string | 密码（第三方登录用 `google_xxx` / `wechat_xxx` 占位） |
| `role` | string | 角色：`user` / `admin` |
| `provider` | string | 登录方式：`email`（默认）/ `google` / `wechat` |
| `googleId` | string | Google 用户唯一 ID（`sub` 字段，仅 Google 登录） |
| `wechatId` | string | 微信唯一 ID（优先 `unionid`，无则用 `openid`，仅微信登录） |
| `openid` | string | 微信 openid（仅微信登录） |
| `unionid` | string | 微信 unionid（仅微信登录，跨应用唯一） |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 2. `user_profiles` — 用户基础资料表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 同 users._id |
| `userId` | string | 关联 users._id |
| `nickname` | string | 昵称 |
| `avatar` | string | 头像 URL |
| `phone` | string | 手机号 |
| `created_at` | datetime | 创建时间 |

---

### 3. `user_market_profiles` — 用户市场画像表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 同 users._id |
| `userId` | string | 关联 users._id |
| `nickname` | string | 昵称 |
| `avatar` | string | 头像 URL |
| `fullName` | string | 真实姓名（实名认证） |
| `idNumber` | string | 身份证号 |
| `isRealNameVerified` | boolean | 是否实名认证 |
| `isInfluencerVerified` | boolean | 是否达人认证 |
| `isMerchantVerified` | boolean | 是否商家认证 |
| `isRealInfluencer` | boolean | 是否真实达人（完成≥1次投放） |
| `isRealMerchant` | boolean | 是否真实商家（参与≥1次或消费≥50） |
| `platform` | string | 达人主营平台 |
| `platformAccount` | string | 达人平台账号 |
| `platformHomeUrl` | string | 达人主页链接 |
| `followers` | string | 粉丝数量 |
| `cost` | string | 单条广告报价（元） |
| `commission` | string | 期望分成比例（%） |
| `companyName` | string | 商家公司名称 |
| `creditCode` | string | 统一社会信用代码 |
| `businessLicenseUrl` | string | 营业执照链接 |
| `brandName` | string | 品牌名称 |
| `contactPerson` | string | 联系人 |
| `contactPhone` | string | 联系电话 |
| `industry` | string | 所属行业 |
| `balance` | string/number | 当前余额 |
| `totalEarnings` | string/number | 累计总收益 |
| `adViewsCount` | number | 累计观看广告数 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 4. `acquisition_bloggers` — 博主/达人线索表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`bl-xxxxxxxx`） |
| `userId` | string | 所属用户 ID |
| `name` | string | 达人昵称 |
| `platform` | string | 主营平台 |
| `followers` | string | 粉丝数量 |
| `email` | string | 联系邮箱 |
| `status` | string | 合作状态：`未联系` / `已联系` / `谈判中` / `已合作` / `已拒绝` / `已删除` |
| `commission` | string | 期望分成比例（%） |
| `cost` | string | 单条广告报价（元） |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 5. `acquisition_b2b_leads` — 企业线索表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`b2b-xxxxxxxx`） |
| `userId` | string | 所属用户 ID |
| `name` | string | 企业名称 |
| `region` | string | 所属区域 |
| `contact` | string | 联系人及职务 |
| `email` | string | 联系邮箱 |
| `source` | string | 线索来源：`手工录入` / `合作申请` |
| `status` | string | 跟进状态：`初步接触` / `跟进中` / `合同拟定` / `已转化` / `已流失` / `待发布` |
| `est_value` | string | 预估合同价值 |
| `type` | string | `follow`（我跟进的客户）/ `publish`（我发布的需求） |
| `isPublic` | boolean | 是否发布到线索池（仅 publish 类型） |
| `publishAt` | datetime | 发布时间 |
| `cooperationCount` | number | 收到的合作申请数 |
| `description` | string | 需求描述 |
| `fromApplicationId` | string | 来源申请 ID（自动录入时填写） |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 6. `acquisition_vc_leads` — VC/融资线索表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`vc-xxxxxxxx`） |
| `userId` | string | 所属用户 ID |
| `name` | string | 机构/企业名称 |
| `region` | string | 所属区域 |
| `contact` | string | 联系人 |
| `email` | string | 联系邮箱 |
| `source` | string | 线索来源：`手工录入` / `对接申请` |
| `status` | string | 状态：`待联系` / `初步沟通` / `尽调` / `已投资` / `已拒绝` / `已发布` / `未发布` |
| `focus` | string | 关注领域 |
| `type` | string | `follow`（我跟进的VC）/ `publish`（我发布的融资需求） |
| `isPublic` | boolean | 是否发布到 VC 线索池 |
| `publishAt` | datetime | 发布时间 |
| `cooperationCount` | number | 收到的对接申请数 |
| `fundingAmount` | string | 融资金额 |
| `fundingStage` | string | 融资阶段（如 Pre-A、A轮） |
| `description` | string | 需求描述 |
| `fromApplicationId` | string | 来源申请 ID |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 7. `acquisition_ads` — 广告任务表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`ad-xxxxxxxx`） |
| `userId` | string | 发布商家 ID |
| `brand` | string | 品牌名称 |
| `type` | string | 广告类型：`视频广告` / `互动广告` / `横幅图片` |
| `duration` | string | 要求时长（如 `30s`、`1m`） |
| `reward` | string | 参与奖励金额（元） |
| `status` | string | 状态：`待审核` / `投放中` / `已暂停` / `已下架` |
| `views` | string/number | 观看次数 |
| `videoUrl` | string | 广告视频直链 URL |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 8. `ad_participations` — 广告任务参与记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`p-xxxxxxxx`） |
| `userId` | string | 参与用户 ID |
| `adId` | string | 关联广告 ID |
| `status` | string | 任务状态：`进行中` / `已完成` |
| `rewardEarned` | string | 获得奖励金额 |
| `completedAt` | datetime | 完成时间 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 9. `user_transactions` — 资金流水表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键 |
| `userId` | string | 关联用户 ID |
| `type` | string | 流水类型：`reward`（任务奖励）/ `recharge`（充值）/ `withdraw`（提现）/ `charge`（扣费）/ `refund`（退款） |
| `amount` | string | 变动金额（正数=收入，负数=支出） |
| `balance` | string | 变动后余额 |
| `orderId` | string | 关联订单/广告 ID |
| `status` | string | 状态：`success` / `processing` / `failed` |
| `remark` | string | 备注说明 |
| `created_at` | datetime | 操作时间 |
| `updated_at` | datetime | 更新时间 |

---

### 10. `cooperation_applications` — 合作申请记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`app-xxxxxxxx`） |
| `leadId` | string | 关联线索 ID |
| `leadType` | string | 线索类型：`b2b` / `vc` |
| `leadOwnerId` | string | 线索发布者 ID（B） |
| `applicantId` | string | 申请人 ID（A） |
| `applicantName` | string | 申请人/公司名称 |
| `applicantContact` | string | 申请人联系电话 |
| `applicantEmail` | string | 申请人邮箱 |
| `message` | string | 申请留言 |
| `status` | string | 申请状态：`pending` / `approved` / `rejected` |
| `applicantVisible` | boolean | 同意后标记，A 可在「我的合作」中查看 |
| `created_at` | datetime | 申请时间 |
| `updated_at` | datetime | 更新时间 |

---

### 11. `scaffold_projects` — 脚手架生成记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 主键（`proj-xxxxxxxx`） |
| `userId` | string | 所属用户 ID |
| `projectName` | string | 项目名称 |
| `template` | string | 使用的模板名称 |
| `zipUrl` | string | 项目压缩包下载地址 |
| `status` | string | 生成状态：`completed` / `failed` |
| `created_at` | datetime | 生成时间 |

---

## 二、API 接口文档

> 所有接口均需携带 Cookie `market_user_id`（登录后自动设置）
> 统一返回：`{ ok: boolean, message: string, data?: any }`

---

### 认证模块 `/api/auth`

#### `POST /api/auth/register` — 注册
**入参**
```json
{ "email": "string", "password": "string（≥6位）" }
```
**返回**
```json
{ "ok": true, "message": "注册成功" }
```

---

#### `POST /api/auth/login` — 登录
**入参**
```json
{ "email": "string", "password": "string" }
```
**返回** + Set-Cookie `market_user_id`
```json
{
  "ok": true,
  "message": "登录成功",
  "user": {
    "userId": "string",
    "email": "string",
    "role": "string",
    "profile": {},
    "marketProfile": {}
  }
}
```

---

#### `GET /api/auth/me` — 获取当前用户信息
**返回**
```json
{
  "ok": true,
  "data": {
    "user": { "email": "string", "role": "string" },
    "profile": { "nickname": "string", "phone": "string", "avatar": "string" },
    "marketProfile": { "balance": "string", "totalEarnings": "string", ... }
  }
}
```

---

#### `POST /api/logout` — 退出登录
清除 Cookie，返回 `{ "ok": true }`

---

### 用户资料模块 `/api/profile`

#### `POST /api/profile/update-base` — 更新基础资料
**入参**
```json
{ "nickname": "string", "phone": "string" }
```

#### `POST /api/profile/update-password` — 修改密码
**入参**
```json
{ "oldPassword": "string", "newPassword": "string（≥6位）" }
```

#### `POST /api/profile/get-password` — 查看当前密码
**返回** `{ "ok": true, "password": "string" }`

#### `POST /api/profile/influencer-apply` — 达人认证
**入参**
```json
{
  "platform": "string",
  "platformAccount": "string",
  "platformHomeUrl": "string",
  "followers": "string",
  "cost": "string",
  "commission": "string"
}
```

#### `POST /api/profile/merchant-apply` — 商家认证
**入参**
```json
{
  "companyName": "string",
  "creditCode": "string",
  "businessLicenseUrl": "string",
  "brandName": "string",
  "contactPerson": "string",
  "contactPhone": "string",
  "industry": "string"
}
```

---

### 钱包模块 `/api/wallet`

#### `GET /api/wallet/info` — 获取余额
**返回** `{ "data": { "balance": "string", "totalEarnings": "string" } }`

#### `GET /api/wallet/transactions` — 获取流水列表
**Query** `?type=reward|recharge|withdraw|charge|refund`（可选）
**返回** `{ "data": { "total": number, "list": [Transaction] } }`

#### `POST /api/wallet/recharge` — 充值（模拟）
**入参** `{ "amount": number }`
**返回** `{ "data": { "amount": "string", "newBalance": "string", "transaction": {} } }`

#### `POST /api/wallet/withdraw` — 提现（模拟）
**入参** `{ "amount": number, "accountInfo": "string（支付宝/微信账号）" }`
**返回** `{ "data": { "amount": "string", "newBalance": "string" } }`

#### `POST /api/wallet/charge` — 商家广告扣费
**入参** `{ "adId": "string", "amount": number }`

#### `POST /api/wallet/confirm-reward` — 确认任务完成发放佣金
**入参** `{ "adId": "string", "participationId": "string", "rewardEarned": number }`

#### `GET /api/wallet/task-earnings` — 达人任务收益统计
**返回**
```json
{
  "data": {
    "totalEarned": "string",
    "available": "string",
    "totalWithdrawn": "string",
    "rewardCount": number
  }
}
```

---

### 广告系统 `/api/ad`

#### `GET /api/ad/list` — 获取投放中广告列表
**返回** `{ "data": { "list": [Ad], "total": number } }`

Ad 字段：`id, brand, type, duration, reward, status, views, videoUrl, createdAt`

#### `GET /api/ad/detail/[adId]` — 获取广告详情
**返回** `{ "data": { "ad": Ad } }`

#### `POST /api/ad/complete` — 完成广告任务，结算奖励
**入参** `{ "adId": "string" }`
**返回**
```json
{
  "data": {
    "reward": "string",
    "newBalance": "string",
    "newTotalEarnings": "string"
  }
}
```
**副作用**：更新 `user_market_profiles.balance`，写入 `user_transactions`（type=reward）

#### `GET /api/ad/my-tasks` — 获取我的任务列表
**Query** `?status=已完成`（可选）
**返回** `{ "data": { "list": [{ ...participation, ad: Ad }], "total": number } }`

---

### 广告管理 `/api/ads`（商家/达人旧版接口）

#### `POST /api/ads/create` — 商家发布广告（需商家认证）
**入参** `{ "brand": "string", "type": "string", "duration": "string", "reward": "string" }`

#### `GET /api/ads/list` — 获取 active 广告列表（需登录）

#### `GET /api/ads/my-ads` — 获取我发布的广告（需商家认证）

#### `POST /api/ads/participate` — 参与广告任务（需达人认证）
**入参** `{ "adId": "string" }`

#### `POST /api/ads/complete` — 完成广告任务（需达人认证）
**入参** `{ "adId": "string", "rewardEarned": number }`

#### `GET /api/ads/my-tasks` — 获取我的任务（需达人认证）

---

### 获客系统统一接口 `/api/market/admin/acquisition`

#### `GET /api/market/admin/acquisition` — 加载全量数据（Bootstrap）
**返回**
```json
{
  "success": true,
  "data": {
    "bloggers": [Blogger],
    "allBloggers": [Blogger],
    "b2bLeads": [B2BLead],
    "vcFollowLeads": [VCLead],
    "vcPublishLeads": [VCLead],
    "ads": [Ad],
    "profile": UserMarketProfile,
    "participations": [AdParticipation],
    "scaffoldProjects": [ScaffoldProject]
  }
}
```

#### `POST /api/market/admin/acquisition` — 执行操作
**入参** `{ "action": "string", ...其他字段 }`

| action | 说明 | 必填字段 |
|--------|------|----------|
| `insert_blogger` | 新增博主 | `name, platform, followers, email, cost, commission` |
| `update_influencer_profile` | 更新达人资料 | 同上 |
| `insert_b2b_lead` | 新增B2B线索 | `name, region, contact, estValue, type` |
| `update_b2b_status` | 更新B2B进度 | `id, status` |
| `insert_vc_lead` | 新增VC线索 | `name, region, contact, focus, type` |
| `update_vc_status` | 更新VC进度 | `id, status` |
| `insert_ad` | 发布广告 | `brand, type, duration, reward, videoUrl?` |
| `update_ad` | 更新广告 | `id, status?, duration?, reward?, videoUrl?` |
| `delete_blogger` | 删除博主 | `id` |
| `delete_blogger_soft` | 软删除博主 | `id` |
| `delete_b2b_lead` | 删除B2B线索 | `id` |
| `delete_vc_lead` | 删除VC线索 | `id` |
| `delete_ad` | 删除广告 | `id` |
| `participate_ad` | 参与广告 | `adId, reward` |
| `complete_ad_task` | 完成广告任务 | `participationId` |
| `update_verification` | 更新认证状态 | `type: realName/influencer/merchant` |
| `publish_b2b_lead` | 发布/下架B2B需求 | `leadId, isPublic` |
| `publish_vc_lead` | 发布/下架VC需求 | `leadId, isPublic` |
| `load_transactions` | 加载流水 | — |
| `request_withdrawal` | 申请提现 | `amount` |
| `send_email` | 发送邮件 | `to, subject, body` |

---

### 线索池模块 `/api/leads`

#### `GET /api/leads/b2b/public-list` — B2B公开线索列表
**Query** `?region=&status=&sortBy=newest|highestValue`

#### `POST /api/leads/b2b/apply-cooperation` — 申请B2B合作（最多15次）
**入参** `{ "leadId": "string", "applicantName": "string", "applicantContact": "string", "applicantEmail": "string", "message?": "string" }`

#### `GET /api/leads/b2b/my-applications` — 获取B2B申请记录
**Query** `?type=received|sent`

#### `POST /api/leads/b2b/my-applications` — 处理B2B申请（同意/拒绝）
**入参** `{ "applicationId": "string", "status": "approved|rejected" }`
**副作用（同意时）**：自动将申请人信息录入 B 的 `acquisition_b2b_leads`（type=follow）

#### `GET /api/leads/vc/public-list` — VC公开线索列表
**Query** `?region=&focus=&sortBy=newest|highestFunding`

#### `POST /api/leads/vc/apply-cooperation` — 申请VC对接（最多15次）
**入参** 同 B2B apply

#### `GET /api/leads/vc/my-applications` — 获取VC申请记录
**Query** `?type=received|sent`

#### `POST /api/leads/vc/my-applications` — 处理VC申请
**副作用（同意时）**：自动将申请人信息录入 B 的 `acquisition_vc_leads`（type=follow）

---

### 文件上传 `/api/upload`

#### `POST /api/upload/video` — 上传广告视频（仅国内 CloudBase）
**入参** `multipart/form-data`，字段名 `file`，仅支持 MP4，最大 200MB
**返回**
```json
{
  "ok": true,
  "data": {
    "videoUrl": "https://7365-services-9g65esd1166c5a97-1347298141.tcb.qcloud.la/advertisements/videos/[文件名].mp4",
    "cloudPath": "advertisements/videos/[文件名].mp4",
    "fileName": "string"
  }
}
```

---

## 三、数据库配置

### 国内 — 腾讯云 CloudBase
```
CLOUDBASE_ENV_ID=<your-cloudbase-env-id>
CLOUDBASE_SECRET_ID=<your-cloudbase-secret-id>
CLOUDBASE_SECRET_KEY=<your-cloudbase-secret-key>
NEXT_PUBLIC_SITE_REGION=cn
```

### 国际 — Supabase
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
NEXT_PUBLIC_SITE_REGION=intl
```

### 视频存储（CloudBase）
```
存储桶：<your-cloudbase-bucket-id>
目录：advertisements/videos/
访问域名：https://<your-cloudbase-bucket-id>.tcb.qcloud.la
```

---

## 四、需要在 Supabase 创建的表

切换到国际版时，需在 Supabase 中创建以下表（字段同上）：

```sql
users, user_profiles, user_market_profiles,
acquisition_bloggers, acquisition_b2b_leads, acquisition_vc_leads,
acquisition_ads, ad_participations, user_transactions,
cooperation_applications, scaffold_projects
```

> 注意：Supabase 主键字段名为 `id`（string），CloudBase 为 `_id`（自动生成）。
> `db-adapter.ts` 已做兼容处理，优先读取 `id`，回退到 `_id`。

---

*最后更新：2026-04-01*
