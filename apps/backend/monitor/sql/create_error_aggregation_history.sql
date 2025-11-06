-- 创建错误聚合历史表
-- 用于存储智能错误聚合的历史结果

CREATE TABLE IF NOT EXISTS error_aggregation_history (
    app_id String,
    timestamp DateTime,
    threshold Float32,
    original_groups UInt32,
    merged_groups UInt32,
    reduction_rate Float32,
    aggregation_data String
) ENGINE = MergeTree()
ORDER BY (app_id, timestamp)
SETTINGS index_granularity = 8192;

-- 创建索引以优化查询
-- CREATE INDEX idx_app_timestamp ON error_aggregation_history (app_id, timestamp) TYPE minmax GRANULARITY 1;

-- 查询示例
-- SELECT * FROM error_aggregation_history WHERE app_id = 'your-app-id' ORDER BY timestamp DESC LIMIT 10;

