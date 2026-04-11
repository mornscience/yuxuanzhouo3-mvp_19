-- =========================================================
-- 数据库类型: 腾讯云 TencentDB for MySQL
-- 文件用途: 创建表结构 + 字段注释 + 常用索引
-- 说明:
-- 1) 这个文件用于 MySQL 8.0+。
-- 2) 每个字段都带有中文注释（COMMENT）。
-- =========================================================

-- ---------------------------------------------------------
-- 1) 统一提交主表：存放 login / launch / connect-capital 三类表单
-- ---------------------------------------------------------
create table if not exists form_submissions (
  id bigint unsigned not null auto_increment comment '主键ID，自增',
  form_type varchar(32) not null comment '表单类型：login / launch / connect-capital',
  source_page varchar(128) not null comment '来源页面路由，如 /login /launch /connect-capital',
  submitted_at datetime not null default current_timestamp comment '提交时间',
  contact_email varchar(255) null comment '联系邮箱',
  project_name varchar(255) null comment '项目名称',
  company_name varchar(255) null comment '公司名称',
  stage varchar(128) null comment '项目阶段（Idea/MVP/Revenue/Scale 等）',
  raise_amount varchar(128) null comment '目标融资金额（文本，避免格式冲突）',
  timeline varchar(255) null comment '时间线（例如 3 months）',
  goal_90_days text null comment '90天目标（launch 表单字段）',
  story text null comment '融资故事/项目说明（长文本）',
  extra_json json null comment '扩展字段JSON（未来新增字段放这里）',
  primary key (id),
  key idx_form_submissions_form_type (form_type),
  key idx_form_submissions_submitted_at (submitted_at),
  key idx_form_submissions_contact_email (contact_email),
  constraint chk_form_type check (form_type in ('login', 'launch', 'connect-capital'))
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='统一表单提交记录表：login / launch / connect-capital';

-- ---------------------------------------------------------
-- 2) 可选: 管理员访问日志表（后台审计用）
-- ---------------------------------------------------------
create table if not exists admin_audit_logs (
  id bigint unsigned not null auto_increment comment '主键ID，自增',
  actor varchar(255) not null comment '操作人（如 admin@email.com）',
  action varchar(128) not null comment '操作类型（如 view_submissions / export_csv）',
  target varchar(255) null comment '操作目标（如 form_submissions）',
  created_at datetime not null default current_timestamp comment '操作发生时间',
  metadata json null comment '附加上下文JSON（IP、UA、筛选条件等）',
  primary key (id),
  key idx_admin_audit_logs_created_at (created_at)
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='管理员操作审计日志';

-- ---------------------------------------------------------
-- 3) 资金流水表：记录所有用户资金变动
-- ---------------------------------------------------------
create table if not exists user_transactions (
  id bigint unsigned not null auto_increment comment '主键ID，自增',
  userId varchar(255) not null comment '用户ID',
  type varchar(32) not null comment '类型：reward/recharge/withdraw/charge/refund',
  amount decimal(12,2) not null comment '变动金额（可正可负）',
  balance decimal(12,2) not null comment '变动后最新余额',
  orderId varchar(255) null comment '关联订单/广告ID/任务ID',
  status varchar(32) not null default 'success' comment '状态：success/processing/failed',
  remark varchar(500) null comment '备注',
  created_at datetime not null default current_timestamp comment '创建时间',
  updated_at datetime not null default current_timestamp on update current_timestamp comment '更新时间',
  primary key (id),
  key idx_user_transactions_userid (userId),
  key idx_user_transactions_type (type),
  key idx_user_transactions_created_at (created_at),
  key idx_user_transactions_orderid (orderId),
  constraint chk_transaction_type check (type in ('reward', 'recharge', 'withdraw', 'charge', 'refund')),
  constraint chk_transaction_status check (status in ('success', 'processing', 'failed'))
) engine=InnoDB default charset=utf8mb4 collate=utf8mb4_0900_ai_ci comment='用户资金流水表';

