-- ============================================
-- 添加 replay_id 字段到 monitor_events 表
-- 版本: 1.0.0
-- 日期: 2025-11-15
-- 说明: 用于关联错误事件和 session replay
-- ============================================

-- 添加 replay_id 字段
ALTER TABLE monitor_events 
ADD COLUMN IF NOT EXISTS replay_id String DEFAULT '' COMMENT 'Session Replay ID (关联到 session_replays 表)';

-- 创建索引以加速查询
ALTER TABLE monitor_events 
ADD INDEX IF NOT EXISTS idx_replay_id (replay_id) 
TYPE bloom_filter 
GRANULARITY 4;

