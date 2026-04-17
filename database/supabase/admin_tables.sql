-- Admin Management Tables for MVP19 International
-- 管理后台相关表结构

-- ==================== 管理员用户表 ====================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.admin_users IS '管理员用户表';
COMMENT ON COLUMN public.admin_users.username IS '用户名';
COMMENT ON COLUMN public.admin_users.password_hash IS '密码哈希';
COMMENT ON COLUMN public.admin_users.role IS '角色: admin(管理员), super_admin(超级管理员)';
COMMENT ON COLUMN public.admin_users.status IS '状态: active(活跃), disabled(禁用)';

-- ==================== 举报管理表 ====================
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID, -- 举报人用户ID
    reporter_email TEXT, -- 举报人邮箱
    reported_user_id UUID, -- 被举报人用户ID
    reported_user_email TEXT, -- 被举报人邮箱
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    resolution_notes TEXT,

    -- 元数据
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.user_reports IS '用户举报表';
COMMENT ON COLUMN public.user_reports.report_type IS '举报类型: spam(垃圾信息), harassment(骚扰), inappropriate(不当内容), other(其他)';
COMMENT ON COLUMN public.user_reports.status IS '状态: pending(待处理), resolved(已处理), dismissed(已驳回)';

-- ==================== 广告管理表 ====================
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
    position VARCHAR(50) NOT NULL CHECK (position IN ('top', 'bottom', 'left', 'right', 'bottom-left', 'bottom-right', 'sidebar')),
    file_url TEXT NOT NULL,
    link_url TEXT,
    priority INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    start_date DATE,
    end_date DATE,
    file_size INTEGER,
    impression_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.advertisements IS '广告管理表';
COMMENT ON COLUMN public.advertisements.type IS '广告类型: image(图片), video(视频)';
COMMENT ON COLUMN public.advertisements.position IS '广告位置';
COMMENT ON COLUMN public.advertisements.status IS '状态: active(激活), inactive(未激活)';

-- ==================== 社交链接表 ====================
CREATE TABLE IF NOT EXISTS public.social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('website', 'github', 'twitter', 'youtube', 'facebook', 'instagram', 'linkedin', 'wechat', 'qq', 'weibo')),
    url TEXT NOT NULL,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.social_links IS '社交链接表';
COMMENT ON COLUMN public.social_links.platform IS '平台: website(网站), github, twitter, youtube, facebook, instagram, linkedin, wechat(微信), qq, weibo(微博)';

-- ==================== 应用发布版本表 ====================
CREATE TABLE IF NOT EXISTS public.app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('android', 'ios', 'web', 'windows', 'macos', 'linux')),
    version VARCHAR(50) NOT NULL,
    build_number VARCHAR(50),
    release_notes TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.app_releases IS '应用发布版本表';
COMMENT ON COLUMN public.app_releases.platform IS '平台: android, ios, web, windows, macos, linux';
COMMENT ON COLUMN public.app_releases.status IS '状态: draft(草稿), published(已发布), archived(已归档)';

-- ==================== 管理员操作日志表 ====================
CREATE TABLE IF NOT EXISTS public.admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.admin_operation_logs IS '管理员操作日志表';

-- ==================== 索引创建 ====================

-- 举报表索引
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_created_at ON public.user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported ON public.user_reports(reported_user_id);

-- 广告表索引
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON public.advertisements(status);
CREATE INDEX IF NOT EXISTS idx_advertisements_position ON public.advertisements(position);
CREATE INDEX IF NOT EXISTS idx_advertisements_created_at ON public.advertisements(created_at DESC);

-- 社交链接表索引
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON public.social_links(platform);
CREATE INDEX IF NOT EXISTS idx_social_links_order ON public.social_links(display_order);
CREATE INDEX IF NOT EXISTS idx_social_links_status ON public.social_links(status);

-- 发布版本表索引
CREATE INDEX IF NOT EXISTS idx_app_releases_platform ON public.app_releases(platform);
CREATE INDEX IF NOT EXISTS idx_app_releases_status ON public.app_releases(status);
CREATE INDEX IF NOT EXISTS idx_app_releases_created_at ON public.app_releases(created_at DESC);

-- 操作日志表索引
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_admin ON public.admin_operation_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_operation_logs_created_at ON public.admin_operation_logs(created_at DESC);

-- ==================== 更新触发器函数 ====================
-- 复用已有的 update_updated_at_column 函数

-- 为新增表添加更新触发器
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON public.advertisements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON public.social_links
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_releases_updated_at BEFORE UPDATE ON public.app_releases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==================== 初始管理员用户 ====================
-- 注意：在实际部署时，密码应该通过应用创建，这里只是示例
-- INSERT INTO public.admin_users (username, password_hash, role) VALUES
-- ('admin', 'hash_of_default_password', 'super_admin');