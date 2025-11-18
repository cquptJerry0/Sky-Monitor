#!/bin/bash

# 注入测试错误数据到 ClickHouse
# 用于测试雷达图显示效果

APP_ID="vanillaGQqHf7"
CLICKHOUSE_URL="http://localhost:8123"

echo "开始注入测试数据..."
echo "APP_ID: $APP_ID"
echo "时间范围: 2025/11/15 - 11/18"
echo "错误类型: error, unhandledrejection, httpError, resourceError"

# 设置时间范围: 2025-11-15 到 2025-11-18
START_DATE="2025-11-15 00:00:00"
END_DATE="2025-11-18 23:59:59"
START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$START_DATE" +%s)
END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "$END_DATE" +%s)
RANGE=$((END_TS - START_TS))

# 插入 JS Error (30条)
echo "插入 JS Error (30条)..."
for i in {1..30}; do
    RANDOM_OFFSET=$((RANDOM % RANGE))
    TS=$((START_TS + RANDOM_OFFSET))
    TIMESTAMP=$(date -j -r $TS '+%Y-%m-%d %H:%M:%S')
    curl -s "$CLICKHOUSE_URL" --data-binary "INSERT INTO sky_monitor.monitor_events (app_id, event_type, event_name, timestamp, user_id, session_id, page_url, error_message, error_stack) VALUES ('$APP_ID', 'error', 'TypeError', '$TIMESTAMP', 'user-$i', 'session-$i', 'https://example.com', 'Cannot read property of undefined', 'Error stack...')" > /dev/null
done

# 插入 Promise Rejection (20条)
echo "插入 Promise Rejection (20条)..."
for i in {1..20}; do
    RANDOM_OFFSET=$((RANDOM % RANGE))
    TS=$((START_TS + RANDOM_OFFSET))
    TIMESTAMP=$(date -j -r $TS '+%Y-%m-%d %H:%M:%S')
    curl -s "$CLICKHOUSE_URL" --data-binary "INSERT INTO sky_monitor.monitor_events (app_id, event_type, event_name, timestamp, user_id, session_id, page_url, error_message, error_stack) VALUES ('$APP_ID', 'unhandledrejection', 'PromiseRejection', '$TIMESTAMP', 'user-$((30 + i))', 'session-$((30 + i))', 'https://example.com', 'Promise rejected', 'Error stack...')" > /dev/null
done

# 插入 HTTP Error (15条)
echo "插入 HTTP Error (15条)..."
for i in {1..15}; do
    RANDOM_OFFSET=$((RANDOM % RANGE))
    TS=$((START_TS + RANDOM_OFFSET))
    TIMESTAMP=$(date -j -r $TS '+%Y-%m-%d %H:%M:%S')
    curl -s "$CLICKHOUSE_URL" --data-binary "INSERT INTO sky_monitor.monitor_events (app_id, event_type, event_name, timestamp, user_id, session_id, page_url, http_url, http_status, http_method, error_message) VALUES ('$APP_ID', 'httpError', 'FetchError', '$TIMESTAMP', 'user-$((50 + i))', 'session-$((50 + i))', 'https://example.com', 'https://api.example.com/data', 500, 'GET', 'HTTP 500 Internal Server Error')" > /dev/null
done

# 插入 Resource Error (10条)
echo "插入 Resource Error (10条)..."
for i in {1..10}; do
    RANDOM_OFFSET=$((RANDOM % RANGE))
    TS=$((START_TS + RANDOM_OFFSET))
    TIMESTAMP=$(date -j -r $TS '+%Y-%m-%d %H:%M:%S')
    curl -s "$CLICKHOUSE_URL" --data-binary "INSERT INTO sky_monitor.monitor_events (app_id, event_type, event_name, timestamp, user_id, session_id, page_url, resource_url, resource_type, error_message) VALUES ('$APP_ID', 'resourceError', 'ResourceLoadError', '$TIMESTAMP', 'user-$((65 + i))', 'session-$((65 + i))', 'https://example.com', 'https://cdn.example.com/script.js', 'script', 'Failed to load resource')" > /dev/null
done

echo ""
echo "✅ 测试数据注入成功!"
echo ""
echo "数据分布:"
echo "- JS Error: 30条"
echo "- Promise Rejection: 20条"
echo "- HTTP Error: 15条"
echo "- Resource Error: 10条"
echo ""
echo "现在可以在 Dashboard 中查看雷达图效果了!"

