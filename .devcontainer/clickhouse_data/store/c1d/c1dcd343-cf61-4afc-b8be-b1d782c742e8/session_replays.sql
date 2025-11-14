ATTACH TABLE _ UUID 'eea8b5d2-4bba-40db-815b-0a645e660705'
(
    `id` UUID DEFAULT generateUUIDv4(),
    `app_id` String,
    `replay_id` String,
    `error_event_id` String DEFAULT '',
    `events` String,
    `event_count` UInt32 DEFAULT 0,
    `duration` UInt32 DEFAULT 0,
    `compressed` UInt8 DEFAULT 0,
    `original_size` UInt32 DEFAULT 0,
    `compressed_size` UInt32 DEFAULT 0,
    `trigger` String DEFAULT '',
    `timestamp` DateTime DEFAULT now(),
    `created_at` DateTime DEFAULT now(),
    INDEX idx_replay_id replay_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_error_event_id error_event_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_trigger trigger TYPE set(10) GRANULARITY 4
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(timestamp)
ORDER BY (app_id, replay_id, timestamp)
SETTINGS index_granularity = 8192
