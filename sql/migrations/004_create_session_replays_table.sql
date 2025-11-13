-- ============================================
-- 创建 Session Replays 表
-- 版本: 1.0.0
-- 日期: 2025-11-13
-- 说明: 专门存储会话重放数据，与 monitor_events 分离
-- ============================================

-- 执行命令: clickhouse-client --query "$(cat sql/migrations/004_create_session_replays_table.sql)"

-- ============================================
-- 1. 创建 session_replays 表
-- ============================================
CREATE TABLE IF NOT EXISTS session_replays (
    -- 主键
    id UUID DEFAULT generateUUIDv4() COMMENT '唯一标识',
    
    -- 应用和会话信息
    app_id String COMMENT '应用ID',
    replay_id String COMMENT 'Replay会话ID',
    error_event_id String DEFAULT '' COMMENT '关联的错误事件ID',
    
    -- Replay 数据
    events String COMMENT 'rrweb事件数组JSON或压缩后的Base64字符串',
    
    -- 元数据
    event_count UInt32 DEFAULT 0 COMMENT 'rrweb事件数量',
    duration UInt32 DEFAULT 0 COMMENT '录制时长(ms)',
    compressed UInt8 DEFAULT 0 COMMENT '是否压缩(0=否, 1=是)',
    original_size UInt32 DEFAULT 0 COMMENT '原始大小(bytes)',
    compressed_size UInt32 DEFAULT 0 COMMENT '压缩后大小(bytes)',
    
    -- 触发方式
    trigger String DEFAULT '' COMMENT '触发方式: error/manual/sampled',
    
    -- 时间戳
    timestamp DateTime DEFAULT now() COMMENT '事件时间',
    created_at DateTime DEFAULT now() COMMENT '创建时间'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, replay_id, timestamp)
SETTINGS index_granularity = 8192
COMMENT '会话重放数据表';

-- ============================================
-- 2. 创建索引
-- ============================================

-- replay_id 索引（用于快速查找特定 replay）
ALTER TABLE session_replays 
ADD INDEX IF NOT EXISTS idx_replay_id (replay_id) 
TYPE bloom_filter 
GRANULARITY 4;

-- error_event_id 索引（用于关联错误事件）
ALTER TABLE session_replays 
ADD INDEX IF NOT EXISTS idx_error_event_id (error_event_id) 
TYPE bloom_filter 
GRANULARITY 4;

-- trigger 索引（用于按触发方式过滤）
ALTER TABLE session_replays 
ADD INDEX IF NOT EXISTS idx_trigger (trigger) 
TYPE set(10) 
GRANULARITY 4;

-- ============================================
-- 3. 查询示例
-- ============================================

-- 查询最近的 10 条 replay
-- SELECT * FROM session_replays ORDER BY timestamp DESC LIMIT 10;

-- 根据 replay_id 查询
-- SELECT * FROM session_replays WHERE replay_id = 'replay_xxx';

-- 根据 error_event_id 查询关联的 replay
-- SELECT * FROM session_replays WHERE error_event_id = 'error_xxx';

-- 查询某个应用的所有 replay
-- SELECT * FROM session_replays WHERE app_id = 'your_app_id' ORDER BY timestamp DESC;

-- 统计 replay 数据量
-- SELECT 
--     app_id,
--     count() as replay_count,
--     sum(original_size) as total_original_size,
--     sum(compressed_size) as total_compressed_size,
--     avg(duration) as avg_duration
-- FROM session_replays
-- GROUP BY app_id;

-- 查询错误触发的 replay
-- SELECT * FROM session_replays WHERE trigger = 'error' ORDER BY timestamp DESC LIMIT 10;

