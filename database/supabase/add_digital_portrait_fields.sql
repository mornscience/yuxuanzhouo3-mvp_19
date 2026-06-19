-- =========================================================
-- 为 user_market_profiles 表添加企业数字画像字段
-- 执行方式: 在 Supabase SQL Editor 中执行此脚本
-- =========================================================

-- 添加产品品类字段 (JSON 字符串)
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS product_categories TEXT;

COMMENT ON COLUMN public.user_market_profiles.product_categories IS '产品品类（JSON字符串数组）';

-- 添加产能规模字段
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS capacity TEXT;

COMMENT ON COLUMN public.user_market_profiles.capacity IS '产能规模描述';

-- 添加价格区间字段
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS price_range TEXT;

COMMENT ON COLUMN public.user_market_profiles.price_range IS '价格区间';

-- 添加质量认证字段 (JSON 字符串)
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS quality_certifications TEXT;

COMMENT ON COLUMN public.user_market_profiles.quality_certifications IS '质量认证（JSON字符串数组）';

-- 添加其他标签字段 (JSON 字符串)
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS other_tags TEXT;

COMMENT ON COLUMN public.user_market_profiles.other_tags IS '其他业务标签（JSON字符串数组）';

-- 添加数字画像更新时间字段
ALTER TABLE public.user_market_profiles 
ADD COLUMN IF NOT EXISTS digital_portrait_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_market_profiles.digital_portrait_updated_at IS '数字画像最后更新时间';

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_market_profiles'
AND column_name IN (
  'product_categories', 
  'capacity', 
  'price_range', 
  'quality_certifications', 
  'other_tags', 
  'digital_portrait_updated_at'
);