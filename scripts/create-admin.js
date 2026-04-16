/**
 * 创建初始管理员账号
 * 运行: node scripts/create-admin.js
 * 
 * 先在 Supabase 执行以下 SQL 创建表：
 * CREATE TABLE IF NOT EXISTS admins (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   username TEXT UNIQUE NOT NULL,
 *   password_hash TEXT NOT NULL,
 *   role TEXT NOT NULL DEFAULT 'admin',
 *   status TEXT NOT NULL DEFAULT 'active',
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW(),
 *   last_login_at TIMESTAMPTZ
 * );
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456'

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const { data, error } = await sb.from('admins').upsert({
    username: ADMIN_USERNAME,
    password_hash: hash,
    role: 'super_admin',
    status: 'active',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'username' }).select().single()

  if (error) {
    console.error('❌ 创建失败:', error.message)
    process.exit(1)
  }
  console.log('✅ 管理员创建成功:', data.username, '/ 角色:', data.role)
  console.log('   登录地址: /admin/login')
  console.log('   用户名:', ADMIN_USERNAME)
  console.log('   密码:', ADMIN_PASSWORD)
}

main()
