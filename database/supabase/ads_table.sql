-- 广告管理表
create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  -- id: 广告ID，唯一标识

  title text not null,
  -- title: 广告标题

  type text not null check (type in ('image', 'video')),
  -- type: 广告类型

  position text not null check (position in ('top', 'bottom', 'left', 'right', 'bottom-left', 'bottom-right', 'sidebar')),
  -- position: 显示位置

  file_url text not null,
  -- file_url: 文件URL

  file_url_cn text,
  -- file_url_cn: 国内版文件URL

  file_url_intl text,
  -- file_url_intl: 国际版文件URL

  link_url text,
  -- link_url: 跳转链接

  priority integer not null default 0,
  -- priority: 优先级

  status text not null default 'active' check (status in ('active', 'inactive')),
  -- status: 状态

  start_date timestamptz,
  -- start_date: 开始日期

  end_date timestamptz,
  -- end_date: 结束日期

  file_size bigint default 0,
  -- file_size: 文件大小（字节）

  created_at timestamptz not null default now(),
  -- created_at: 创建时间

  updated_at timestamptz not null default now(),
  -- updated_at: 更新时间

  impression_count integer not null default 0,
  -- impression_count: 曝光次数

  click_count integer not null default 0,
  -- click_count: 点击次数

  created_by text
  -- created_by: 创建人ID
);

comment on table public.advertisements is '广告管理表';
comment on column public.advertisements.id is '广告ID';
comment on column public.advertisements.title is '广告标题';
comment on column public.advertisements.type is '广告类型';
comment on column public.advertisements.position is '显示位置';
comment on column public.advertisements.file_url is '文件URL';
comment on column public.advertisements.file_url_cn is '国内版文件URL';
comment on column public.advertisements.file_url_intl is '国际版文件URL';
comment on column public.advertisements.link_url is '跳转链接';
comment on column public.advertisements.priority is '优先级';
comment on column public.advertisements.status is '状态';
comment on column public.advertisements.start_date is '开始日期';
comment on column public.advertisements.end_date is '结束日期';
comment on column public.advertisements.file_size is '文件大小';
comment on column public.advertisements.created_at is '创建时间';
comment on column public.advertisements.updated_at is '更新时间';
comment on column public.advertisements.impression_count is '曝光次数';
comment on column public.advertisements.click_count is '点击次数';
comment on column public.advertisements.created_by is '创建人ID';

-- 常用索引
create index if not exists idx_advertisements_status on public.advertisements(status);
create index if not exists idx_advertisements_position on public.advertisements(position);
create index if not exists idx_advertisements_priority on public.advertisements(priority desc);
create index if not exists idx_advertisements_created_at on public.advertisements(created_at desc);