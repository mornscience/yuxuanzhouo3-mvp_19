-- 应用发布版本表（修复版本）
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
    created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.app_releases IS '应用发布版本表';
COMMENT ON COLUMN public.app_releases.platform IS '平台: android, ios, web, windows, macos, linux';
COMMENT ON COLUMN public.app_releases.status IS '状态: draft(草稿), published(已发布), archived(已归档)';

-- 发布版本表索引
CREATE INDEX IF NOT EXISTS idx_app_releases_platform ON public.app_releases(platform);
CREATE INDEX IF NOT EXISTS idx_app_releases_status ON public.app_releases(status);
CREATE INDEX IF NOT EXISTS idx_app_releases_created_at ON public.app_releases(created_at DESC);

-- 为表添加更新触发器
CREATE TRIGGER update_app_releases_updated_at BEFORE UPDATE ON public.app_releases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
