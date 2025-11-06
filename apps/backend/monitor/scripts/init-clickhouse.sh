#!/bin/bash

# ClickHouse 数据库初始化脚本
# 用于创建必要的表和索引

set -e

CLICKHOUSE_HOST=${CLICKHOUSE_HOST:-localhost}
CLICKHOUSE_PORT=${CLICKHOUSE_PORT:-8123}
CLICKHOUSE_USER=${CLICKHOUSE_USER:-default}
CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-skyClickhouse2024}

echo "================================================"
echo "  ClickHouse 数据库初始化"
echo "================================================"
echo ""
echo "连接信息："
echo "  Host: $CLICKHOUSE_HOST"
echo "  Port: $CLICKHOUSE_PORT"
echo "  User: $CLICKHOUSE_USER"
echo ""

# 检查 ClickHouse 连接
echo "1. 检查 ClickHouse 连接..."
if curl -s "http://$CLICKHOUSE_HOST:$CLICKHOUSE_PORT/ping" > /dev/null; then
    echo "   ✓ ClickHouse 连接成功"
else
    echo "   ✗ ClickHouse 连接失败"
    exit 1
fi

# 执行 SQL 文件
SQL_DIR="$(cd "$(dirname "$0")/../sql" && pwd)"
SQL_FILE="$SQL_DIR/create_error_aggregation_history.sql"

echo ""
echo "2. 创建 error_aggregation_history 表..."
if [ -f "$SQL_FILE" ]; then
    curl -s "http://$CLICKHOUSE_HOST:$CLICKHOUSE_PORT/" \
        --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
        --data-binary @"$SQL_FILE"
    
    if [ $? -eq 0 ]; then
        echo "   ✓ 表创建成功"
    else
        echo "   ✗ 表创建失败"
        exit 1
    fi
else
    echo "   ✗ SQL 文件不存在: $SQL_FILE"
    exit 1
fi

# 验证表是否存在
echo ""
echo "3. 验证表结构..."
VERIFY_QUERY="DESCRIBE TABLE error_aggregation_history"
RESULT=$(curl -s "http://$CLICKHOUSE_HOST:$CLICKHOUSE_PORT/" \
    --user "$CLICKHOUSE_USER:$CLICKHOUSE_PASSWORD" \
    --data-urlencode "query=$VERIFY_QUERY")

if [ -n "$RESULT" ]; then
    echo "   ✓ 表结构验证成功"
    echo ""
    echo "表结构："
    echo "$RESULT" | head -n 10
else
    echo "   ✗ 表结构验证失败"
    exit 1
fi

echo ""
echo "================================================"
echo "  初始化完成！"
echo "================================================"

