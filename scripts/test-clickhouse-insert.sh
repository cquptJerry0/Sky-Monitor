#!/bin/bash

# 测试 ClickHouse 数据插入
# 用法: bash scripts/test-clickhouse-insert.sh

echo "=========================================="
echo "测试 ClickHouse 数据插入"
echo "=========================================="
echo ""

# 发送测试事件
echo "发送测试事件到 DSN Server..."
curl -X POST http://localhost:8080/api/monitoring/vanillamy7Z4k \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event",
    "name": "test_event",
    "message": "测试 UUID 修复",
    "path": "/test",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "等待 2 秒..."
sleep 2

echo ""
echo "查询 ClickHouse 最新数据..."
docker exec -it sky-monitor-clickhouse clickhouse-client \
  -u default \
  --password skyClickhouse2024 \
  --query "SELECT id, app_id, event_type, event_name, timestamp FROM monitor_events WHERE app_id='vanillamy7Z4k' ORDER BY timestamp DESC LIMIT 5 FORMAT Pretty"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
