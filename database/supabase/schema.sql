-- =========================================================
-- 数据库类型: Supabase (PostgreSQL)
-- 文件用途: 创建表结构 + 字段注释 + 常用索引
-- 说明:
-- 1) 这个文件只能用于 PostgreSQL / Supabase。
-- 2) 每个字段都带有中文 COMMENT，便于你直接理解含义。
-- =========================================================

-- 可选: 使用 UUID 生成函数（Supabase 默认通常已启用）
create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1) 统一提交主表：存放 login / launch / connect-capital 三类表单
-- ---------------------------------------------------------
create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  -- id: 主键ID，唯一标识一条提交记录

  form_type text not null check (form_type in ('login', 'launch', 'connect-capital')),
  -- form_type: 表单类型
  --   login            = 登录表单
  --   launch           = 项目启动表单
  --   connect-capital  = 融资对接表单

  source_page text not null,
  -- source_page: 来源页面路由，例如 /login、/launch、/connect-capital

  submitted_at timestamptz not null default now(),
  -- submitted_at: 用户提交时间（带时区）

  contact_email text,
  -- contact_email: 联系邮箱（login/融资表单中常用）

  project_name text,
  -- project_name: 项目名称（launch 常用）

  company_name text,
  -- company_name: 公司名称（connect-capital 常用）

  stage text,
  -- stage: 当前阶段（如 Idea / MVP / Revenue / Scale）

  raise_amount text,
  -- raise_amount: 目标融资金额（文本存储，避免币种格式冲突）

  timeline text,
  -- timeline: 融资或推进时间线（例如 3 months）

  goal_90_days text,
  -- goal_90_days: 90 天目标（launch 表单字段）

  story text,
  -- story: 融资故事/项目说明（长文本）

  extra_json jsonb not null default '{}'::jsonb
  -- extra_json: 扩展字段（用于未来新增字段，避免频繁改表）
);

comment on table public.form_submissions is '统一表单提交记录表：login / launch / connect-capital';
comment on column public.form_submissions.id is '主键ID，UUID';
comment on column public.form_submissions.form_type is '表单类型：login / launch / connect-capital';
comment on column public.form_submissions.source_page is '来源页面路由';
comment on column public.form_submissions.submitted_at is '提交时间（带时区）';
comment on column public.form_submissions.contact_email is '联系邮箱';
comment on column public.form_submissions.project_name is '项目名称';
comment on column public.form_submissions.company_name is '公司名称';
comment on column public.form_submissions.stage is '项目阶段';
comment on column public.form_submissions.raise_amount is '目标融资金额（文本）';
comment on column public.form_submissions.timeline is '时间线';
comment on column public.form_submissions.goal_90_days is '90天目标';
comment on column public.form_submissions.story is '说明/故事';
comment on column public.form_submissions.extra_json is '扩展JSON字段';

-- 常用索引
create index if not exists idx_form_submissions_form_type on public.form_submissions(form_type);
-- idx_form_submissions_form_type: 按表单类型过滤时更快

create index if not exists idx_form_submissions_submitted_at on public.form_submissions(submitted_at desc);
-- idx_form_submissions_submitted_at: 按提交时间倒序查询更快

create index if not exists idx_form_submissions_contact_email on public.form_submissions(contact_email);
-- idx_form_submissions_contact_email: 按邮箱检索更快

-- ---------------------------------------------------------
-- 2) 可选: 管理员访问日志表（后台审计用）
-- ---------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- id: 主键ID

  actor text not null,
  -- actor: 操作人（例如 admin@email.com）

  action text not null,
  -- action: 操作类型（例如 view_submissions / export_csv）

  target text,
  -- target: 操作目标（例如 form_submissions）

  created_at timestamptz not null default now(),
  -- created_at: 操作发生时间

  metadata jsonb not null default '{}'::jsonb
  -- metadata: 附加上下文（IP、UA、筛选条件等）
);

comment on table public.admin_audit_logs is '管理员操作审计日志';
comment on column public.admin_audit_logs.id is '主键ID';
comment on column public.admin_audit_logs.actor is '操作人';
comment on column public.admin_audit_logs.action is '操作动作';
comment on column public.admin_audit_logs.target is '操作目标';
comment on column public.admin_audit_logs.created_at is '操作时间';
comment on column public.admin_audit_logs.metadata is '附加上下文JSON';

create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);
-- idx_admin_audit_logs_created_at: 后台审计按时间查看更快

