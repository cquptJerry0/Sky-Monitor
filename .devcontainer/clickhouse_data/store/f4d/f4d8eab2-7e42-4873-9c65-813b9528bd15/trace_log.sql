ATTACH TABLE _ UUID 'a61e6cfd-11a8-48b0-8012-eac5b99470c8'
(
    `hostname` LowCardinality(String) COMMENT 'Hostname of the server executing the query.',
    `event_date` Date COMMENT 'Date of sampling moment.',
    `event_time` DateTime COMMENT 'Timestamp of the sampling moment.',
    `event_time_microseconds` DateTime64(6) COMMENT 'Timestamp of the sampling moment with microseconds precision.',
    `timestamp_ns` UInt64 COMMENT 'Timestamp of the sampling moment in nanoseconds.',
    `revision` UInt32 COMMENT 'ClickHouse server build revision.',
    `trace_type` Enum8('Real' = 0, 'CPU' = 1, 'Memory' = 2, 'MemorySample' = 3, 'MemoryPeak' = 4, 'ProfileEvent' = 5, 'JemallocSample' = 6, 'MemoryAllocatedWithoutCheck' = 7) COMMENT 'Trace type: `Real` represents collecting stack traces by wall-clock time. `CPU` represents collecting stack traces by CPU time. `Memory` represents collecting allocations and deallocations when memory allocation exceeds the subsequent watermark. `MemorySample` represents collecting random allocations and deallocations. `MemoryPeak` represents collecting updates of peak memory usage. `ProfileEvent` represents collecting of increments of profile events. `JemallocSample` represents collecting of jemalloc samples. `MemoryAllocatedWithoutCheck` represents collection of significant allocations (>16MiB) that is done with ignoring any memory limits (for ClickHouse developers only).',
    `thread_id` UInt64 COMMENT 'Thread identifier.',
    `query_id` String COMMENT 'Query identifier that can be used to get details about a query that was running from the query_log system table.',
    `trace` Array(UInt64) COMMENT 'Stack trace at the moment of sampling. Each element is a virtual memory address inside ClickHouse server process.',
    `size` Int64 COMMENT 'For trace types Memory, MemorySample, MemoryAllocatedWithoutCheck or MemoryPeak is the amount of memory allocated, for other trace types is 0.',
    `ptr` UInt64 COMMENT 'The address of the allocated chunk.',
    `memory_context` Enum8('Unknown' = -1, 'Global' = 0, 'User' = 1, 'Process' = 2, 'Thread' = 3, 'Max' = 4) COMMENT 'Memory Tracker context (only for Memory/MemoryPeak): `Unknown` context is not defined for this trace_type. `Global` represents server context. `User` represents user/merge context. `Process` represents process (i.e. query) context. `Thread` represents thread (thread of particular process) context. `Max` this is a special value means that memory tracker is not blocked (for blocked_context column). ',
    `memory_blocked_context` Enum8('Unknown' = -1, 'Global' = 0, 'User' = 1, 'Process' = 2, 'Thread' = 3, 'Max' = 4) COMMENT 'Context for which memory tracker is blocked (for ClickHouse developers only): `Unknown` context is not defined for this trace_type. `Global` represents server context. `User` represents user/merge context. `Process` represents process (i.e. query) context. `Thread` represents thread (thread of particular process) context. `Max` this is a special value means that memory tracker is not blocked (for blocked_context column). ',
    `event` LowCardinality(String) COMMENT 'For trace type ProfileEvent is the name of updated profile event, for other trace types is an empty string.',
    `increment` Int64 COMMENT 'For trace type ProfileEvent is the amount of increment of profile event, for other trace types is 0.',
    `symbols` Array(LowCardinality(String)) COMMENT 'If the symbolization is enabled, contains demangled symbol names, corresponding to the `trace`.',
    `lines` Array(LowCardinality(String)) COMMENT 'If the symbolization is enabled, contains strings with file names with line numbers, corresponding to the `trace`.',
    `build_id` String ALIAS '103CD50CAD996B133EEF19E29E9CB9CDD2DFFA50'
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_time)
SETTINGS index_granularity = 8192
COMMENT 'Contains stack traces collected by the sampling query profiler.\n\nIt is safe to truncate or drop this table at any time.'
