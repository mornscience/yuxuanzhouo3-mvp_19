-- =========================================================
-- 添加会员相关字段到 user_market_profiles 表
-- 用于支持会员充值后自动切换高端AI模型
-- =========================================================

-- 添加会员状态字段
alter table if exists public.user_market_profiles
add column if not exists is_premium boolean default false;
-- is_premium: 是否是付费会员

alter table if exists public.user_market_profiles
add column if not exists premium_expires_at timestamptz;
-- premium_expires_at: 会员到期时间

alter table if exists public.user_market_profiles
add column if not exists premium_plan text;
-- premium_plan: 会员套餐名称（如 monthly / yearly）

-- 添加字段注释
comment on column public.user_market_profiles.is_premium is '是否是付费会员';
comment on column public.user_market_profiles.premium_expires_at is '会员到期时间';
comment on column public.user_market_profiles.premium_plan is '会员套餐名称';

-- 可选: 添加索引（如果需要按会员状态查询）
create index if not exists idx_user_market_profiles_is_premium 
on public.user_market_profiles(is_premium);

create index if not exists idx_user_market_profiles_premium_expires_at 
on public.user_market_profiles(premium_expires_at);

-- =========================================================
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- =========================================================