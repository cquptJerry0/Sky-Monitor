#!/bin/bash

# Redis 配置验证脚本
# 用于检查 Redis 是否正确配置并可用

set -e

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
REDIS_PASSWORD=${REDIS_PASSWORD:-skyRedis2024}

echo "================================================"
echo "  Redis 配置验证"
echo "================================================"
echo ""
echo "连接信息："
echo "  Host: $REDIS_HOST"
echo "  Port: $REDIS_PORT"
echo ""

# 检查 redis-cli 是否可用
if ! command -v redis-cli &> /dev/null; then
    echo "⚠ redis-cli 未安装，尝试使用 telnet..."
    
    # 尝试使用 telnet
    if command -v telnet &> /dev/null; then
        echo "1. 测试 Redis 连接..."
        (echo "PING"; sleep 1) | telnet $REDIS_HOST $REDIS_PORT 2>&1 | grep -q "PONG"
        if [ $? -eq 0 ]; then
            echo "   ✓ Redis 连接成功"
        else
            echo "   ✗ Redis 连接失败"
            exit 1
        fi
    else
        echo "   ✗ 无法测试 Redis 连接（缺少 redis-cli 和 telnet）"
        echo ""
        echo "请安装 redis-cli："
        echo "  macOS:   brew install redis"
        echo "  Ubuntu:  sudo apt-get install redis-tools"
        echo "  CentOS:  sudo yum install redis"
        exit 1
    fi
else
    echo "1. 测试 Redis 连接..."
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD PING > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✓ Redis 连接成功"
    else
        echo "   ✗ Redis 连接失败"
        echo ""
        echo "可能的原因："
        echo "  1. Redis 服务未启动"
        echo "  2. 密码错误"
        echo "  3. 端口不正确"
        echo ""
        echo "启动 Redis："
        echo "  macOS:   brew services start redis"
        echo "  Ubuntu:  sudo systemctl start redis"
        echo "  Docker:  docker run -d -p 6379:6379 redis:latest redis-server --requirepass skyRedis2024"
        exit 1
    fi

    # 检查 Redis 版本
    echo ""
    echo "2. 检查 Redis 版本..."
    VERSION=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO server 2>/dev/null | grep redis_version | cut -d: -f2 | tr -d '\r')
    if [ -n "$VERSION" ]; then
        echo "   ✓ Redis 版本: $VERSION"
    else
        echo "   ⚠ 无法获取 Redis 版本"
    fi

    # 测试基本操作
    echo ""
    echo "3. 测试基本操作..."
    
    # SET
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD SET sky_monitor_test "test_value" EX 10 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✓ SET 操作成功"
    else
        echo "   ✗ SET 操作失败"
        exit 1
    fi
    
    # GET
    VALUE=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD GET sky_monitor_test 2>/dev/null)
    if [ "$VALUE" == "test_value" ]; then
        echo "   ✓ GET 操作成功"
    else
        echo "   ✗ GET 操作失败"
        exit 1
    fi
    
    # DEL
    redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD DEL sky_monitor_test > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✓ DEL 操作成功"
    else
        echo "   ✗ DEL 操作失败"
        exit 1
    fi

    # 检查内存使用
    echo ""
    echo "4. 检查内存使用..."
    MEMORY=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD INFO memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    if [ -n "$MEMORY" ]; then
        echo "   ✓ 已使用内存: $MEMORY"
    else
        echo "   ⚠ 无法获取内存信息"
    fi

    # 检查持久化配置
    echo ""
    echo "5. 检查持久化配置..."
    RDB=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD CONFIG GET save 2>/dev/null | tail -n 1)
    AOF=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD CONFIG GET appendonly 2>/dev/null | tail -n 1)
    
    if [ -n "$RDB" ]; then
        echo "   RDB 持久化: $RDB"
    fi
    if [ "$AOF" == "yes" ]; then
        echo "   AOF 持久化: 已启用"
    else
        echo "   AOF 持久化: 未启用"
    fi
fi

echo ""
echo "================================================"
echo "  验证完成！Redis 配置正常"
echo "================================================"
echo ""
echo "环境变量配置："
echo "  export REDIS_HOST=$REDIS_HOST"
echo "  export REDIS_PORT=$REDIS_PORT"
echo "  export REDIS_PASSWORD=$REDIS_PASSWORD"

