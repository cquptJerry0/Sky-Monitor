-- 监控事件表
-- 删除已有的表（如果存在）
DROP TABLE IF EXISTS monitor_events;

-- 创建监控事件表
CREATE TABLE monitor_events (
    id UUID DEFAULT generateUUIDv4 (), -- 事件唯一标识
    app_id String, -- 应用ID
    event_type String, -- 事件类型: error, unhandledrejection, httpError, resourceError, webVital, message, event
    event_name String DEFAULT '', -- 事件名称，对于webVital是LCP/FCP/CLS/TTFB等
    event_data String, -- 事件数据，JSON格式（向后兼容）
    path String DEFAULT '', -- 页面路径
    user_agent String DEFAULT '', -- 浏览器UA
    timestamp DateTime DEFAULT now(), -- 事件时间
    created_at DateTime DEFAULT now(), -- 创建时间
    
    -- 错误相关字段
    error_message String DEFAULT '', -- 错误消息
    error_stack String DEFAULT '', -- 错误堆栈
    error_lineno UInt32 DEFAULT 0, -- 错误行号
    error_colno UInt32 DEFAULT 0, -- 错误列号
    error_fingerprint String DEFAULT '', -- 错误指纹（用于去重和聚合）
    
    -- 设备信息
    device_browser String DEFAULT '', -- 浏览器名称
    device_browser_version String DEFAULT '', -- 浏览器版本
    device_os String DEFAULT '', -- 操作系统
    device_os_version String DEFAULT '', -- 操作系统版本
    device_type String DEFAULT '', -- 设备类型: mobile, tablet, desktop
    device_screen String DEFAULT '', -- 屏幕分辨率
    
    -- 网络信息
    network_type String DEFAULT '', -- 网络类型: 4g, 3g, 2g, slow-2g
    network_rtt UInt32 DEFAULT 0, -- 往返时间(ms)
    
    -- 框架信息
    framework String DEFAULT '', -- 框架: vue, react, ''
    component_name String DEFAULT '', -- 组件名称
    component_stack String DEFAULT '', -- 组件堆栈
    
    -- HTTP 错误相关
    http_url String DEFAULT '', -- 请求URL
    http_method String DEFAULT '', -- 请求方法: GET, POST, etc.
    http_status UInt16 DEFAULT 0, -- HTTP状态码
    http_duration UInt32 DEFAULT 0, -- 请求耗时(ms)
    
    -- 资源错误相关
    resource_url String DEFAULT '', -- 资源URL
    resource_type String DEFAULT '', -- 资源类型: script, img, link, video, audio
    resource_tag_name String DEFAULT '', -- 资源标签名: img, script, link, video, audio
    resource_outer_html String DEFAULT '', -- 资源外部HTML

    -- Session 相关
    session_id String DEFAULT '', -- 会话ID
    session_start_time UInt64 DEFAULT 0, -- 会话开始时间(时间戳)
    session_duration UInt32 DEFAULT 0, -- 会话持续时长(ms)
    session_event_count UInt32 DEFAULT 0, -- 会话事件数
    session_error_count UInt32 DEFAULT 0, -- 会话错误数
    session_page_views UInt32 DEFAULT 0, -- 会话页面浏览数

    -- User 相关
    user_id String DEFAULT '', -- 用户ID
    user_email String DEFAULT '', -- 用户邮箱
    user_username String DEFAULT '', -- 用户名
    user_ip String DEFAULT '', -- 用户IP

    -- Context 相关
    tags String DEFAULT '', -- 标签(JSON)
    extra String DEFAULT '', -- 额外信息(JSON)
    breadcrumbs String DEFAULT '', -- 面包屑(JSON)
    contexts String DEFAULT '', -- 上下文(JSON)
    event_level String DEFAULT '', -- 事件级别: info, warning, error
    environment String DEFAULT '', -- 环境: development, staging, production

    -- Performance 相关
    perf_category String DEFAULT '', -- 性能类别: http, resourceTiming
    perf_value Float64 DEFAULT 0, -- 性能值(Web Vitals)
    perf_is_slow UInt8 DEFAULT 0, -- 是否慢请求(0/1)
    perf_success UInt8 DEFAULT 0, -- 是否成功(0/1)
    perf_metrics String DEFAULT '', -- 性能指标(JSON)

    -- Metadata 相关
    dedup_count UInt32 DEFAULT 1, -- 去重计数
    sampling_rate Float32 DEFAULT 1.0, -- 采样率
    sampling_sampled UInt8 DEFAULT 1, -- 是否被采样(0/1)

    -- HTTP 错误扩展字段
    http_status_text String DEFAULT '', -- HTTP 状态文本
    http_request_headers String DEFAULT '', -- 请求头(JSON)
    http_response_headers String DEFAULT '', -- 响应头(JSON)
    http_request_body String DEFAULT '', -- 请求体(JSON或文本)
    http_response_body String DEFAULT '', -- 响应体(JSON或文本)

    -- Release 相关(用于 SourceMap 匹配)
    release String DEFAULT '' -- 版本号
) ENGINE = MergeTree ()
PARTITION BY
    toYYYYMM (timestamp)
ORDER BY (app_id, timestamp, event_type, error_fingerprint) SETTINGS index_granularity = 8192;

-- 创建索引以提高查询性能
-- 错误指纹索引（用于错误聚合）
ALTER TABLE monitor_events ADD INDEX idx_error_fingerprint (error_fingerprint) TYPE bloom_filter GRANULARITY 4;

-- 框架索引
ALTER TABLE monitor_events ADD INDEX idx_framework (framework) TYPE set(10) GRANULARITY 4;

-- 事件类型索引
ALTER TABLE monitor_events ADD INDEX idx_event_type (event_type) TYPE set(20) GRANULARITY 4;

-- HTTP状态码索引
ALTER TABLE monitor_events ADD INDEX idx_http_status (http_status) TYPE set(100) GRANULARITY 4;

-- 查询示例
-- SELECT * FROM monitor_events ORDER BY timestamp DESC LIMIT 10;
-- SELECT event_type, count() as cnt FROM monitor_events GROUP BY event_type;
-- SELECT * FROM monitor_events WHERE app_id = 'your_app_id' ORDER BY timestamp DESC LIMIT 100;