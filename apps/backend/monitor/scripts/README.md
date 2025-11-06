# 后端初始化和验证脚本

本目录包含用于初始化和验证 Sky Monitor 后端服务所需的数据库和缓存服务的脚本。

---

## 脚本列表

### 1. `init-clickhouse.sh`

**用途**: 初始化 ClickHouse 数据库，创建必需的表

**使用方法**:

```bash
./scripts/init-clickhouse.sh
```

**环境变量**:

```bash
CLICKHOUSE_HOST=localhost      # 默认: localhost
CLICKHOUSE_PORT=8123           # 默认: 8123
CLICKHOUSE_USER=default        # 默认: default
CLICKHOUSE_PASSWORD=skyClickhouse2024
```

**执行内容**:

-   检查 ClickHouse 连接
-   创建 `error_aggregation_history` 表
-   验证表结构

**预期输出**:

```
================================================
  ClickHouse 数据库初始化
================================================

连接信息：
  Host: localhost
  Port: 8123
  User: default

1. 检查 ClickHouse 连接...
   ✓ ClickHouse 连接成功

2. 创建 error_aggregation_history 表...
   ✓ 表创建成功

3. 验证表结构...
   ✓ 表结构验证成功

================================================
  初始化完成！
================================================
```

---

### 2. `verify-redis.ts`

**用途**: 验证 Redis 配置和连接（Node.js 版本，推荐）

**使用方法**:

```bash
npx ts-node scripts/verify-redis.ts
```

**环境变量**:

```bash
REDIS_HOST=localhost      # 默认: localhost
REDIS_PORT=6379           # 默认: 6379
REDIS_PASSWORD=skyRedis2024
```

**测试内容**:

-   Redis 连接测试
-   Redis 版本检查
-   基本操作测试（SET/GET/DEL）
-   列表操作测试（LPUSH/LRANGE/LTRIM）
-   内存使用检查
-   持久化配置检查

**预期输出**:

```
================================================
  Redis 配置验证 (Node.js)
================================================

连接信息：
  Host: localhost
  Port: 6379

1. 测试 Redis 连接...
   ✓ Redis 连接成功

2. 检查 Redis 版本...
   ✓ Redis 版本: 8.2.2

3. 测试基本操作...
   ✓ SET 操作成功
   ✓ GET 操作成功
   ✓ SETEX 操作成功
   ✓ DEL 操作成功

4. 测试列表操作...
   ✓ LPUSH 操作成功
   ✓ LRANGE 操作成功
   ✓ LTRIM 操作成功
   ✓ 清理测试数据成功

5. 检查内存使用...
   ✓ 已使用内存: 1.27M

6. 检查持久化配置...
   RDB 持久化: 未配置
   AOF 持久化: 已启用

================================================
  ✅ 验证完成！Redis 配置正常
================================================
```

---

### 3. `verify-redis.sh`

**用途**: 验证 Redis 配置和连接（Shell 版本）

**使用方法**:

```bash
./scripts/verify-redis.sh
```

**环境变量**: 同 `verify-redis.ts`

**前置要求**: 需要安装 `redis-cli` 或 `telnet`

**安装 redis-cli**:

```bash
# macOS
brew install redis

# Ubuntu/Debian
sudo apt-get install redis-tools

# CentOS/RHEL
sudo yum install redis
```

---

## 快速开始

### 初始化所有服务

```bash
# 1. 进入后端目录
cd apps/backend/monitor

# 2. 初始化 ClickHouse
./scripts/init-clickhouse.sh

# 3. 验证 Redis
npx ts-node scripts/verify-redis.ts

# 4. 启动服务
pnpm dev
```

### 一键初始化脚本

```bash
# 创建一键初始化脚本
cat > scripts/init-all.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Sky Monitor 一键初始化 ==="
echo ""

echo "1. 初始化 ClickHouse..."
./scripts/init-clickhouse.sh
echo ""

echo "2. 验证 Redis..."
npx ts-node scripts/verify-redis.ts
echo ""

echo "=== 初始化完成！==="
echo ""
echo "下一步："
echo "  pnpm dev    # 启动开发服务器"
EOF

chmod +x scripts/init-all.sh

# 执行
./scripts/init-all.sh
```

---

## 故障排查

### ClickHouse 连接失败

**错误**: `Connection refused`

**解决方案**:

```bash
# 检查服务状态
sudo systemctl status clickhouse-server

# 启动服务
sudo systemctl start clickhouse-server

# 测试连接
curl http://localhost:8123/ping
```

---

### Redis 连接失败

**错误**: `Connection refused` 或 `NOAUTH Authentication required`

**解决方案**:

```bash
# 检查服务状态
redis-cli ping

# 测试密码
redis-cli -a skyRedis2024 ping

# 启动服务
# macOS
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis
```

---

### ts-node 未找到

**错误**: `ts-node: command not found`

**解决方案**:

```bash
# 安装依赖
pnpm install

# 或使用 npx
npx ts-node scripts/verify-redis.ts
```

---

## 环境变量配置

### 创建 .env 文件

```bash
# 开发环境
cp .env.example .env

# 生产环境
cp .env.example .env.production
```

### 示例配置

```bash
# ClickHouse
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=skyClickhouse2024

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=skyRedis2024
```

---

## 相关文档

-   [部署配置指南](../../../docs/deployment/DEPLOYMENT_GUIDE.md)
-   [重构完成总结](../../../docs/backend/REFACTORING_COMPLETION_SUMMARY.md)
-   [配置完成确认](../../../CONFIGURATION_COMPLETE.md)

---

## 维护说明

### 更新 ClickHouse 表

如需修改表结构，编辑 `sql/create_error_aggregation_history.sql`，然后重新运行初始化脚本。

### 添加新的验证脚本

参考现有脚本的格式，确保：

1. 包含清晰的输出信息
2. 使用 ✓ 和 ✗ 标记成功/失败
3. 提供详细的错误提示
4. 支持环境变量配置

---

**如有问题，请查看部署配置指南或联系后端团队。**
