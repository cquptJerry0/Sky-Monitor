-- ============================================
-- 添加缺失的基础字段
-- 这些字段在 monitor_events.sql 中定义，但实际表中缺失
-- ============================================

-- 错误相关字段
ALTER TABLE monitor_events 
  ADD COLUMN IF NOT EXISTS error_message String DEFAULT '' COMMENT '错误消息',
  ADD COLUMN IF NOT EXISTS error_stack String DEFAULT '' COMMENT '错误堆栈',
  ADD COLUMN IF NOT EXISTS error_lineno UInt32 DEFAULT 0 COMMENT '错误行号',
  ADD COLUMN IF NOT EXISTS error_colno UInt32 DEFAULT 0 COMMENT '错误列号',
  ADD COLUMN IF NOT EXISTS error_fingerprint String DEFAULT '' COMMENT '错误指纹';

-- 设备信息字段
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS device_browser String DEFAULT '' COMMENT '浏览器名称',
  ADD COLUMN IF NOT EXISTS device_browser_version String DEFAULT '' COMMENT '浏览器版本',
  ADD COLUMN IF NOT EXISTS device_os String DEFAULT '' COMMENT '操作系统',
  ADD COLUMN IF NOT EXISTS device_os_version String DEFAULT '' COMMENT '操作系统版本',
  ADD COLUMN IF NOT EXISTS device_type String DEFAULT '' COMMENT '设备类型',
  ADD COLUMN IF NOT EXISTS device_screen String DEFAULT '' COMMENT '屏幕分辨率';

-- 网络信息字段
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS network_type String DEFAULT '' COMMENT '网络类型',
  ADD COLUMN IF NOT EXISTS network_rtt UInt32 DEFAULT 0 COMMENT '网络往返时间(ms)';

-- 框架信息字段
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS framework String DEFAULT '' COMMENT '框架: vue, react',
  ADD COLUMN IF NOT EXISTS component_name String DEFAULT '' COMMENT '组件名称',
  ADD COLUMN IF NOT EXISTS component_stack String DEFAULT '' COMMENT '组件堆栈';

-- HTTP 错误字段
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS http_url String DEFAULT '' COMMENT '请求URL',
  ADD COLUMN IF NOT EXISTS http_method String DEFAULT '' COMMENT '请求方法',
  ADD COLUMN IF NOT EXISTS http_status UInt16 DEFAULT 0 COMMENT 'HTTP状态码',
  ADD COLUMN IF NOT EXISTS http_duration UInt32 DEFAULT 0 COMMENT '请求耗时(ms)';

-- 资源错误字段
ALTER TABLE monitor_events
  ADD COLUMN IF NOT EXISTS resource_url String DEFAULT '' COMMENT '资源URL',
  ADD COLUMN IF NOT EXISTS resource_type String DEFAULT '' COMMENT '资源类型';

-- 添加索引
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_error_fingerprint (error_fingerprint) TYPE bloom_filter GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_framework (framework) TYPE set(10) GRANULARITY 4;
ALTER TABLE monitor_events ADD INDEX IF NOT EXISTS idx_http_status (http_status) TYPE set(100) GRANULARITY 4;

