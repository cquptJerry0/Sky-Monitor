# Monitor Server 测试文档

## 测试架构

本项目采用**统一的 E2E 测试套件**，覆盖所有 Monitor Server API。

### 设计原则

1. **单一测试文件**：所有 API 测试集中在 `monitor-api.e2e.test.ts`
2. **独立测试用户**：每次测试运行创建独立用户，避免冲突
3. **完整生命周期**：创建用户 → 创建应用 → 插入数据 → 测试 API → 清理
4. **无 4xx 错误**：所有测试应该成功（除非明确测试权限场景）
5. **模块化组织**：按 API 模块组织测试用例

## 测试结构

```
test/
├── monitor-api.e2e.test.ts  # 主测试文件（统一的 E2E 测试）
├── helpers/
│   └── test-data.helper.ts  # 测试数据辅助工具
├── setup.ts                  # 测试环境准备脚本
└── README.md                 # 本文档
```

## 测试覆盖

### 1. Health API

-   `GET /health` - 健康检查
-   `GET /health/dependencies` - 依赖状态

### 2. Auth API

-   `POST /auth/login` - 用户登录
-   `GET /me` - 获取当前用户
-   `POST /auth/refresh` - 刷新 token

### 3. Application API

-   `GET /application` - 获取应用列表
-   `POST /application` - 创建应用

### 4. Events API - 基础查询

-   `GET /events` - 获取事件列表
-   `GET /events/:id` - 获取事件详情
-   `GET /events/stats/summary` - 统计摘要
-   `GET /events/app/:appId/summary` - 应用摘要

### 5. Events API - Session

-   `GET /events/sessions/list` - 会话列表
-   `GET /events/sessions/:sessionId` - 会话详情

### 6. Events API - Performance

-   `GET /events/performance/slow-requests` - 慢请求列表

### 7. Events API - Error Groups

-   `GET /events/errors/groups` - 错误聚合

### 8. Events API - User

-   `GET /events/users/:userId` - 用户事件

### 9. Events API - Sampling

-   `GET /events/stats/sampling` - 采样率统计

### 10. 权限测试

-   测试访问不存在的应用（403）
-   测试无效 token（401）

### 11. 边界情况

-   空应用测试
-   不存在的资源测试

### 12. 性能测试

-   查询响应时间测试

## 运行测试

### 前置条件

确保以下服务正在运行：

```bash
# 1. 启动数据库服务（Docker）
docker compose up -d

# 2. 启动 DSN Server
cd apps/backend/dsn-server
pnpm start:dev

# 3. 启动 Monitor Server
cd apps/backend/monitor
pnpm start:dev
```

### 运行测试命令

```bash
# 运行完整的 E2E 测试
pnpm test:e2e

# 只检查测试环境（不运行测试）
pnpm test:setup

# 监听模式（开发时使用）
pnpm test:e2e:watch

# 运行单元测试
pnpm test:unit

# 运行所有测试（单元测试 + E2E 测试）
pnpm test
```

## 测试数据管理

### 自动创建

每次测试运行时自动创建：

-   **测试用户**：`test_monitor_<timestamp>`
-   **测试应用**：`test-app-<timestamp>-<random>`
-   **测试事件**：5 条标准事件（session、error、performance 等）

### 自动清理

测试结束后自动清理：

-   删除测试应用
-   删除测试用户（标记清理）
-   清理 ClickHouse 中的测试事件

## 测试辅助工具

### TestDataHelper

位置：`test/helpers/test-data.helper.ts`

主要功能：

-   `createTestUser()` - 创建测试用户
-   `login()` - 登录获取 token
-   `createTestApp()` - 创建测试应用
-   `insertTestEvents()` - 插入测试事件
-   `createStandardTestEvents()` - 生成标准测试事件
-   `cleanupTestData()` - 清理测试数据
-   `deleteTestApp()` - 删除测试应用
-   `deleteTestUser()` - 删除测试用户

## 测试最佳实践

### 1. 测试隔离

✅ **正确**：每个测试套件使用独立用户

```typescript
const testUsername = `test_monitor_${Date.now()}`
const { userId, token } = await testHelper.createTestUser(testUsername, 'password')
```

❌ **错误**：共享用户可能导致冲突

```typescript
// 不要在多个测试中使用同一个 admin 用户
await testHelper.login('admin', 'admin123')
```

### 2. 错误处理

✅ **正确**：检查变量是否已初始化

```typescript
afterAll(async () => {
    if (testHelper && testApp) {
        await testHelper.cleanupTestData(testApp.appId)
    }
    if (clickhouseClient) {
        await clickhouseClient.close()
    }
})
```

❌ **错误**：直接访问可能未初始化的变量

```typescript
afterAll(async () => {
    await testHelper.cleanupTestData(testApp.appId) // 可能是 undefined
})
```

### 3. 状态码期望

✅ **正确**：只期望成功的状态码

```typescript
expect(status).toBe(200)
// 或
expect([200, 201]).toContain(status)
```

❌ **错误**：期望错误状态码（除非测试权限）

```typescript
expect([200, 401, 403]).toContain(status) // 不应该出现 401/403
```

### 4. 数据准备

✅ **正确**：在 beforeAll 中准备所有数据

```typescript
beforeAll(async () => {
    // 创建用户、应用、插入数据
    testUser = await testHelper.createTestUser(...)
    testApp = await testHelper.createTestApp(...)
    await testHelper.insertTestEvents(...)
})
```

❌ **错误**：在每个测试中重复创建数据

```typescript
it('test', async () => {
    const app = await testHelper.createTestApp(...) // 浪费时间
})
```

## 常见问题

### Q: 测试失败 "PostgreSQL 连接失败"

**A**: 确保 Monitor Server 正在运行：

```bash
cd apps/backend/monitor
pnpm start:dev
```

### Q: 测试失败 "DSN Server 未运行"

**A**: 确保 DSN Server 正在运行：

```bash
cd apps/backend/dsn-server
pnpm start:dev
```

### Q: 测试失败 "ClickHouse 连接失败"

**A**: 确保 Docker 容器正在运行：

```bash
docker compose up -d
docker ps | grep clickhouse
```

### Q: 测试创建用户失败 "用户已存在"

**A**: 测试用户使用时间戳命名，不应该冲突。如果出现，检查是否有其他测试正在运行。

### Q: 所有测试都返回 403

**A**: 可能是 token 失效或用户没有权限。检查：

1. 测试用户是否成功创建
2. 测试应用是否属于测试用户
3. token 是否正确设置

## 技术栈

-   **测试框架**: Vitest
-   **HTTP 客户端**: Axios
-   **数据库**: ClickHouse + PostgreSQL
-   **认证**: JWT Bearer Token

## 维护指南

### 添加新的 API 测试

在 `monitor-api.e2e.test.ts` 中添加新的 `describe` 块：

```typescript
describe('New API Module', () => {
    it('GET /new-endpoint - 应该返回数据', async () => {
        const { status, data } = await client.get('/new-endpoint', {
            params: { appId: testApp.appId },
        })

        expect(status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
    })
})
```

### 更新测试数据

修改 `TestDataHelper.createStandardTestEvents()` 方法：

```typescript
createStandardTestEvents(sessionId: string, userId: string): TestEvent[] {
    return [
        // 添加新的测试事件
        {
            event_type: 'new-type',
            // ...
        },
    ]
}
```

## 性能指标

预期性能：

-   **测试总时长**：< 5 秒
-   **单个查询**：< 1 秒
-   **测试覆盖率**：> 80%

## 版本历史

-   **v2.0.0** (2025-01-06): 统一测试架构，单一测试文件
-   **v1.0.0** (2024-12-XX): 初始版本，多个测试文件
