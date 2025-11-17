-- ============================================
-- Sky Monitor ClickHouse 完整初始化脚本
-- 版本: 1.0.0
-- 日期: 2025-11-17
-- 说明: 用于初始化空白 ClickHouse 数据库的完整 Schema
-- ============================================

-- 执行命令: clickhouse-client --query "$(cat sql/init/clickhouse/001_init_schema.sql)"

-- ============================================
-- 1. monitor_events 表 (监控事件)
-- ============================================
CREATE TABLE IF NOT EXISTS monitor_events (
    -- 基础字段 (9个)
    id UUID DEFAULT generateUUIDv4() COMMENT '事件唯一标识',
    app_id String COMMENT '应用ID',
    event_type String COMMENT '事件类型: error, unhandledrejection, httpError, resourceError, webVital, performance, session, message, event',
    event_name String DEFAULT '' COMMENT '事件名称(webVital: LCP/FCP/CLS/TTFB/FID/INP)',
    event_data String COMMENT '事件数据JSON(向后兼容)',
    path String DEFAULT '' COMMENT '页面路径',
    user_agent String DEFAULT '' COMMENT '浏览器UA',
    timestamp DateTime DEFAULT now() COMMENT '事件时间',
    created_at DateTime DEFAULT now() COMMENT '创建时间',
    
    -- 错误相关字段 (5个)
    error_message String DEFAULT '' COMMENT '错误消息',
    error_stack String DEFAULT '' COMMENT '错误堆栈',
    error_lineno UInt32 DEFAULT 0 COMMENT '错误行号',
    error_colno UInt32 DEFAULT 0 COMMENT '错误列号',
    error_fingerprint String DEFAULT '' COMMENT '错误指纹(用于去重和聚合)',
    
    -- 设备信息 (6个)
    device_browser String DEFAULT '' COMMENT '浏览器名称',
    device_browser_version String DEFAULT '' COMMENT '浏览器版本',
    device_os String DEFAULT '' COMMENT '操作系统',
    device_os_version String DEFAULT '' COMMENT '操作系统版本',
    device_type String DEFAULT '' COMMENT '设备类型: mobile/tablet/desktop',
    device_screen String DEFAULT '' COMMENT '屏幕分辨率',
    
    -- 网络信息 (2个)
    network_type String DEFAULT '' COMMENT '网络类型: 4g/3g/2g/slow-2g',
    network_rtt UInt32 DEFAULT 0 COMMENT '往返时间(ms)',
    
    -- 框架信息 (3个)
    framework String DEFAULT '' COMMENT '框架: vue/react',
    component_name String DEFAULT '' COMMENT '组件名称',
    component_stack String DEFAULT '' COMMENT '组件堆栈',
    
    -- HTTP 错误相关 (9个)
    http_url String DEFAULT '' COMMENT '请求URL',
    http_method String DEFAULT '' COMMENT '请求方法: GET/POST',
    http_status UInt16 DEFAULT 0 COMMENT 'HTTP状态码',
    http_duration UInt32 DEFAULT 0 COMMENT '请求耗时(ms)',
    http_status_text String DEFAULT '' COMMENT 'HTTP状态文本',
    http_request_headers String DEFAULT '' COMMENT '请求头JSON',
    http_response_headers String DEFAULT '' COMMENT '响应头JSON',
    http_request_body String DEFAULT '' COMMENT '请求体',
    http_response_body String DEFAULT '' COMMENT '响应体',
    
    -- 资源错误相关 (4个)
    resource_url String DEFAULT '' COMMENT '资源URL',
    resource_type String DEFAULT '' COMMENT '资源类型: script/img/link/video/audio',
    resource_tag_name String DEFAULT '' COMMENT '资源标签名',
    resource_outer_html String DEFAULT '' COMMENT '资源外部HTML',
    
    -- Session 相关 (6个)
    session_id String DEFAULT '' COMMENT '会话ID',
    session_start_time UInt64 DEFAULT 0 COMMENT '会话开始时间(Unix时间戳ms)',
    session_duration UInt32 DEFAULT 0 COMMENT '会话持续时长(ms)',
    session_event_count UInt16 DEFAULT 0 COMMENT '会话事件数',
    session_error_count UInt16 DEFAULT 0 COMMENT '会话错误数',
    session_page_views UInt16 DEFAULT 0 COMMENT '会话页面浏览数',
    
    -- User 相关 (4个)
    user_id String DEFAULT '' COMMENT '用户ID',
    user_email String DEFAULT '' COMMENT '用户邮箱',
    user_username String DEFAULT '' COMMENT '用户名',
    user_ip String DEFAULT '' COMMENT '用户IP地址',
    
    -- Context 相关 (6个)
    tags String DEFAULT '' COMMENT '标签JSON',
    extra String DEFAULT '' COMMENT '额外信息JSON',
    breadcrumbs String DEFAULT '' COMMENT '面包屑JSON',
    contexts String DEFAULT '' COMMENT '上下文JSON',
    event_level String DEFAULT '' COMMENT '事件级别: debug/info/warning/error/fatal',
    environment String DEFAULT '' COMMENT '环境: development/staging/production',
    
    -- Performance 相关 (5个)
    perf_category String DEFAULT '' COMMENT '性能类别: http/webvital',
    perf_value Float64 DEFAULT 0 COMMENT '性能值(Web Vitals)',
    perf_is_slow UInt8 DEFAULT 0 COMMENT '是否慢请求(0/1)',
    perf_success UInt8 DEFAULT 0 COMMENT '是否成功(0/1)',
    perf_metrics String DEFAULT '' COMMENT '性能指标JSON',
    
    -- Metadata 相关 (3个)
    dedup_count UInt32 DEFAULT 1 COMMENT '去重计数',
    sampling_rate Float32 DEFAULT 1.0 COMMENT '采样率(0.0-1.0)',
    sampling_sampled UInt8 DEFAULT 1 COMMENT '是否被采样(0/1)',
    
    -- Release 相关 (2个)
    release String DEFAULT '' COMMENT '版本号(用于SourceMap匹配)',
    replay_id String DEFAULT '' COMMENT 'Session Replay ID'
    
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, timestamp, event_type, error_fingerprint)
SETTINGS index_granularity = 8192
COMMENT '监控事件表';

-- ============================================
-- 2. 创建 monitor_events 索引
-- ============================================
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_error_fingerprint (error_fingerprint) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_framework (framework) TYPE set(10) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_event_type (event_type) TYPE set(20) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_http_status (http_status) TYPE set(100) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_session_id (session_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_user_id (user_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_event_level (event_level) TYPE set(10) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_perf_category (perf_category) TYPE set(5) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_replay_id (replay_id) TYPE bloom_filter GRANULARITY 4;

-- ============================================
-- 3. session_replays 表 (会话重放)
-- ============================================
CREATE TABLE IF NOT EXISTS session_replays (
    id UUID DEFAULT generateUUIDv4() COMMENT '唯一标识',
    app_id String COMMENT '应用ID',
    replay_id String COMMENT 'Replay会话ID',
    error_event_id String DEFAULT '' COMMENT '关联的错误事件ID',
    events String COMMENT 'rrweb事件数组JSON或压缩后的Base64',
    event_count UInt32 DEFAULT 0 COMMENT 'rrweb事件数量',
    duration UInt32 DEFAULT 0 COMMENT '录制时长(ms)',
    compressed UInt8 DEFAULT 0 COMMENT '是否压缩(0/1)',
    original_size UInt32 DEFAULT 0 COMMENT '原始大小(bytes)',
    compressed_size UInt32 DEFAULT 0 COMMENT '压缩后大小(bytes)',
    trigger String DEFAULT '' COMMENT '触发方式: error/manual/sampled',
    timestamp DateTime DEFAULT now() COMMENT '事件时间',
    created_at DateTime DEFAULT now() COMMENT '创建时间'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, replay_id, timestamp)
SETTINGS index_granularity = 8192
COMMENT '会话重放数据表';

-- ============================================
-- 4. 创建 session_replays 索引
-- ============================================
ALTER TABLE session_replays ADD INDEX IF NOT EXISTS idx_replay_id (replay_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE session_replays ADD INDEX IF NOT EXISTS idx_error_event_id (error_event_id) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE session_replays ADD INDEX IF NOT EXISTS idx_trigger (trigger) TYPE set(10) GRANULARITY 4;

-- ============================================
-- 初始化完成
-- ============================================
-- 查询所有表
SHOW TABLES;

