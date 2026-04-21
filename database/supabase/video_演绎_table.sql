-- 视频演绎表
create table if not exists public.video_deduction (
  id uuid primary key default gen_random_uuid(),
  -- id: 视频ID，唯一标识

  title text not null,
  -- title: 视频标题

  video_url text not null,
  -- video_url: 视频URL

  is_active boolean not null default false,
  -- is_active: 是否为当前播放视频

  file_size bigint default 0,
  -- file_size: 文件大小（字节）

  duration integer default 0,
  -- duration: 视频时长（秒）

  created_at timestamptz not null default now(),
  -- created_at: 创建时间

  updated_at timestamptz not null default now()
  -- updated_at: 更新时间
);

comment on table public.video_deduction is '视频演绎表';
comment on column public.video_deduction.id is '视频ID';
comment on column public.video_deduction.title is '视频标题';
comment on column public.video_deduction.video_url is '视频URL';
comment on column public.video_deduction.is_active is '是否为当前播放视频';
comment on column public.video_deduction.file_size is '文件大小';
comment on column public.video_deduction.duration is '视频时长';
comment on column public.video_deduction.created_at is '创建时间';
comment on column public.video_deduction.updated_at is '更新时间';

-- 常用索引
create index if not exists idx_video_deduction_is_active on public.video_deduction(is_active);
create index if not exists idx_video_deduction_created_at on public.video_deduction(created_at desc);