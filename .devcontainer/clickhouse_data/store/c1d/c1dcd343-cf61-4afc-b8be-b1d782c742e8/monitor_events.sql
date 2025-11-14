ATTACH TABLE _ UUID 'a787ca1e-64ea-49b9-b1d1-ae6f2fa55d88'
(
    `id` UUID DEFAULT generateUUIDv4(),
    `app_id` String,
    `event_type` String,
    `event_name` String DEFAULT '',
    `event_data` String,
    `path` String DEFAULT '',
    `user_agent` String DEFAULT '',
    `timestamp` DateTime DEFAULT now(),
    `created_at` DateTime DEFAULT now(),
    `error_message` String DEFAULT '',
    `error_stack` String DEFAULT '',
    `error_lineno` UInt32 DEFAULT 0,
    `error_colno` UInt32 DEFAULT 0,
    `error_fingerprint` String DEFAULT '',
    `device_browser` String DEFAULT '',
    `device_browser_version` String DEFAULT '',
    `device_os` String DEFAULT '',
    `device_os_version` String DEFAULT '',
    `device_type` String DEFAULT '',
    `device_screen` String DEFAULT '',
    `network_type` String DEFAULT '',
    `network_rtt` UInt32 DEFAULT 0,
    `framework` String DEFAULT '',
    `component_name` String DEFAULT '',
    `component_stack` String DEFAULT '',
    `http_url` String DEFAULT '',
    `http_method` String DEFAULT '',
    `http_status` UInt16 DEFAULT 0,
    `http_duration` UInt32 DEFAULT 0,
    `resource_url` String DEFAULT '',
    `resource_type` String DEFAULT '',
    `session_replay_events` String DEFAULT '',
    `session_replay_size` UInt32 DEFAULT 0,
    INDEX idx_error_fingerprint error_fingerprint TYPE bloom_filter GRANULARITY 4,
    INDEX idx_framework framework TYPE set(10) GRANULARITY 4,
    INDEX idx_event_type event_type TYPE set(20) GRANULARITY 4,
    INDEX idx_http_status http_status TYPE set(100) GRANULARITY 4
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, timestamp, event_type, error_fingerprint)
SETTINGS index_granularity = 8192
