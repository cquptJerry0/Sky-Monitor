#!/bin/bash

# ============================================
# Sky Monitor 数据库初始化脚本
# 版本: 1.0.0
# 日期: 2025-11-17
# 说明: 一键初始化空白数据库(PostgreSQL + ClickHouse)
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-}

CLICKHOUSE_HOST=${CLICKHOUSE_HOST:-localhost}
CLICKHOUSE_PORT=${CLICKHOUSE_PORT:-8123}
CLICKHOUSE_USER=${CLICKHOUSE_USER:-default}
CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-}

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SQL_DIR="$PROJECT_ROOT/sql"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装,请先安装 $1"
        exit 1
    fi
}

# 检查 Docker 容器是否运行
check_docker_container() {
    local container_name=$1
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_error "Docker 容器 $container_name 未运行"
        log_info "请先启动容器: docker-compose up -d $container_name"
        exit 1
    fi
}

# 初始化 PostgreSQL
init_postgresql() {
    log_info "开始初始化 PostgreSQL..."
    
    # 检查 Docker 容器
    check_docker_container "sky-monitor-postgresql"
    
    # 执行初始化脚本
    local init_script="$SQL_DIR/init/postgresql/001_init_schema.sql"
    
    if [ ! -f "$init_script" ]; then
        log_error "初始化脚本不存在: $init_script"
        exit 1
    fi
    
    log_info "执行 PostgreSQL 初始化脚本..."
    docker exec -i sky-monitor-postgresql psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$init_script"
    
    log_success "PostgreSQL 初始化完成"
}

# 初始化 ClickHouse
init_clickhouse() {
    log_info "开始初始化 ClickHouse..."
    
    # 检查 Docker 容器
    check_docker_container "sky-monitor-clickhouse"
    
    # 执行初始化脚本
    local init_script="$SQL_DIR/init/clickhouse/001_init_schema.sql"
    
    if [ ! -f "$init_script" ]; then
        log_error "初始化脚本不存在: $init_script"
        exit 1
    fi
    
    log_info "执行 ClickHouse 初始化脚本..."
    docker exec -i sky-monitor-clickhouse clickhouse-client --multiquery < "$init_script"
    
    log_success "ClickHouse 初始化完成"
}

# 验证数据库
verify_databases() {
    log_info "验证数据库初始化..."
    
    # 验证 PostgreSQL
    log_info "验证 PostgreSQL 表..."
    docker exec sky-monitor-postgresql psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt" | grep -E "admin|application|source_maps|dashboard|dashboard_widget|alert_rules"
    
    # 验证 ClickHouse
    log_info "验证 ClickHouse 表..."
    docker exec sky-monitor-clickhouse clickhouse-client --query "SHOW TABLES" | grep -E "monitor_events|session_replays"
    
    log_success "数据库验证通过"
}

# 主函数
main() {
    echo ""
    log_info "=========================================="
    log_info "Sky Monitor 数据库初始化"
    log_info "=========================================="
    echo ""
    
    # 检查必要的命令
    check_command "docker"
    
    # 询问用户确认
    read -p "$(echo -e ${YELLOW}是否要初始化数据库? 这将创建所有表结构 [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消操作"
        exit 0
    fi
    
    # 初始化 PostgreSQL
    init_postgresql
    echo ""
    
    # 初始化 ClickHouse
    init_clickhouse
    echo ""
    
    # 验证
    verify_databases
    echo ""
    
    log_success "=========================================="
    log_success "数据库初始化完成!"
    log_success "=========================================="
}

# 执行主函数
main "$@"

