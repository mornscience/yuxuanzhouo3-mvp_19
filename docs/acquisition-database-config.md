# 获客系统数据库配置与环境变量说明

本文档详细列出了获客系统（Acquisition System）运行所需的所有数据库参数及环境变量，并附带详细批注。

## 1. 核心运行环境 (Global)

| 变量名 | 类型 | 描述 | 默认值 | 批注 |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_DEPLOYMENT_REGION` | `CN` / `INTL` | 部署区域 | `INTL` | 决定使用哪种数据库方案：`CN` 使用腾讯云 CloudBase，`INTL` 使用 Supabase。如果未配置任何数据库，将回退到本地 JSON 文件。 |
| `MARKET_ADMIN_KEY` | `string` | 管理员密钥 | `orbitchat-admin` | 用于 API 鉴权的 Token，前端调用后端 API 时需在 Header 中携带 `x-admin-key`。 |

## 2. Supabase 配置 (国际版 / INTL)

当 `NEXT_PUBLIC_DEPLOYMENT_REGION=INTL` 时生效。

| 变量名 | 描述 | 批注 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 从 Supabase Dashboard -> Project Settings -> API 获取。通常格式为 `https://xxx.supabase.co`。 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色 Key | **必需**。服务端专用，具有完整数据库读写权限。请勿泄露到前端。 |

## 3. 腾讯云 CloudBase 配置 (国内版 / CN)

当 `NEXT_PUBLIC_DEPLOYMENT_REGION=CN` 时生效。

| 变量名 | 描述 | 批注 |
| :--- | :--- | :--- |
| `CLOUDBASE_ENV_ID` | 环境 ID | 腾讯云云开发控制台 -> 环境 -> 环境 ID (例如 `env-xxxxxx`)。 |
| `CLOUDBASE_SECRET_ID` | API 密钥 ID | 腾讯云访问管理 (CAM) 控制台获取。 |
| `CLOUDBASE_SECRET_KEY` | API 密钥 Key | 与 SecretId 配对，用于服务端身份验证。 |

## 4. 邮件发送配置 (SMTP)

用于获客系统中向博主或企业发送合作邀请邮件。

| 变量名 | 描述 | 批注 |
| :--- | :--- | :--- |
| `AUTH_EMAIL_SMTP_HOST` | SMTP 服务器地址 | 例如 `smtp.qq.com` 或 `smtp.gmail.com`。 |
| `AUTH_EMAIL_SMTP_PORT` | SMTP 端口 | 通常为 `465` (SSL) 或 `587` (TLS)。 |
| `AUTH_EMAIL_SMTP_USER` | SMTP 用户名 | 通常是你的邮箱地址。 |
| `AUTH_EMAIL_SMTP_PASS` | SMTP 授权码/密码 | 注意：通常不是邮箱登录密码，而是第三方应用授权码。 |
| `AUTH_EMAIL_FROM` | 发件人名称/地址 | 邮件中显示的发送者名称。 |

## 5. 数据库表结构 (Schema)

适配器会自动处理表（或集合）的创建。以下是核心表名及用途：

- `acquisition_bloggers`: 存储 KOL/博主线索，包含粉丝量、平台、合作状态等。
- `acquisition_b2b_leads`: 存储企业采购线索，包含区域、联系人、预估价值等。
- `acquisition_vc_leads`: 存储 VC 投资机构线索，包含关注领域、推进阶段等。
- `acquisition_ads`: 存储 Ad-to-Earn 广告位，包含品牌、奖励金额、观看次数等。

## 6. 运行机制说明 (Runnable Logic)

1. **自动回退 (Fallback)**: 如果未检测到任何云端数据库配置（Supabase 或 CloudBase），系统会自动切换到 **本地模式**，将数据保存在 `data/acquisition/*.json` 中。这保证了代码在任何环境下都能立即运行。
2. **种子数据 (Seeding)**: 系统在首次启动时，如果数据库为空，会自动插入演示用的种子数据（如“科技评测_老马”等）。
3. **区域感知**: 后端会根据 `REGION` 变量自动路由 CRUD 操作到对应的存储介质。

---
*最后更新日期: 2026-03-30*
