-- ============================================
-- Sky Monitor SDK 新功能字段迁移
-- 版本: 1.0.0
-- 日期: 2025-11-04
-- 说明: 添加 Session、Scope、Performance、Deduplication、Sampling 等功能支持
-- ============================================

-- 执行前请确认当前环境，建议先在测试环境验证
-- 执行命令: clickhouse-client --query "$(cat sql/migrations/001_add_sdk_features.sql)"

-- ============================================
-- 1. Session 会话追踪字段（6个）
-- ============================================
ALTER TABLE monitor_events 
  ADD COLUMN IF NOT EXISTS session_id String DEFAULT '' COMMENT '会话ID',
  ADD COLUMN IF NOT EXISTS session_start_time UInt64 DEFAULT 0 COMMENT '会话开始时间(Unix时间戳ms)',
  ADD COLUMN IF NOT EXISTS session_duration UInt32 DEFAULT 0 COMMENT '会话持续时间(ms)',
  ADD COLUMN IF NOT EXISTS session_event_count UInt16 DEFAULT 0 COMMENT '会话事件总数',
  ADD COLUMN IF NOT EXISTS session_error_count UInt16 DEFAULT 0 COMMENT '会话错误数',
  ADD COLUMN IF NOT EXISTS session_page_views UInt16 DEFAULT 0 COMMENT '会话页面浏览数';

-- ============================================
-- 2. User 用户信息字段（4个）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS user_id String DEFAULT '' COMMENT '用户ID',
  ADD COLUMN IF NOT EXISTS user_email String DEFAULT '' COMMENT '用户邮箱',
  ADD COLUMN IF NOT EXISTS user_username String DEFAULT '' COMMENT '用户名',
  ADD COLUMN IF NOT EXISTS user_ip String DEFAULT '' COMMENT '用户IP地址';

-- ============================================
-- 3. Scope 上下文字段（4个，JSON存储）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS tags String DEFAULT '' COMMENT '标签JSON: {"env":"prod","version":"1.0"}',
  ADD COLUMN IF NOT EXISTS extra String DEFAULT '' COMMENT '额外数据JSON',
  ADD COLUMN IF NOT EXISTS breadcrumbs String DEFAULT '' COMMENT '面包屑操作历史JSON',
  ADD COLUMN IF NOT EXISTS contexts String DEFAULT '' COMMENT '自定义上下文JSON';

-- ============================================
-- 4. Event 级别和环境（2个字段）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS event_level String DEFAULT '' COMMENT '事件级别: debug/info/warning/error/fatal',
  ADD COLUMN IF NOT EXISTS environment String DEFAULT '' COMMENT '环境: dev/staging/production';

-- ============================================
-- 5. Performance 性能字段（5个）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS perf_category String DEFAULT '' COMMENT '性能分类: http/webvital',
  ADD COLUMN IF NOT EXISTS perf_value Float64 DEFAULT 0 COMMENT '性能指标值',
  ADD COLUMN IF NOT EXISTS perf_is_slow UInt8 DEFAULT 0 COMMENT '是否慢请求: 0/1',
  ADD COLUMN IF NOT EXISTS perf_success UInt8 DEFAULT 0 COMMENT '请求是否成功: 0/1',
  ADD COLUMN IF NOT EXISTS perf_metrics String DEFAULT '' COMMENT '额外性能指标JSON';

-- ============================================
-- 6. Deduplication 去重元数据（1个字段）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS dedup_count UInt32 DEFAULT 1 COMMENT '错误重复次数';

-- ============================================
-- 7. Sampling 采样元数据（2个字段）
-- ============================================
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS sampling_rate Float32 DEFAULT 1.0 COMMENT '采样率: 0.0-1.0',
  ADD COLUMN IF NOT EXISTS sampling_sampled UInt8 DEFAULT 1 COMMENT '是否被采样: 0/1';

-- ============================================
-- 8. 新增索引（优化查询性能）
-- ============================================
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_session_id (session_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_user_id (user_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_event_level (event_level) TYPE set(10) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_perf_category (perf_category) TYPE set(5) GRANULARITY 4;

-- ============================================
-- 验证字段是否添加成功
-- ============================================
-- SELECT name, type, comment FROM system.columns 
-- WHERE table = 'monitor_events' AND database = currentDatabase()
-- ORDER BY name;


