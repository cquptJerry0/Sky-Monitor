# DSN Server 测试文档

## 测试架构

本项目采用**统一的 E2E 测试套件**，覆盖所有 DSN Server API。

### 设计原则

1. **单一测试文件**：所有 API 测试集中在 `dsn-api.e2e.test.ts`
2. **独立测试用户**：通过 Monitor Server 创建独立用户和应用
3. **完整生命周期**：创建用户 → 创建应用 → 测试 API → 清理
4. **数据验证**：验证事件正确写入 ClickHouse
5. **无依赖硬编码**：不使用硬编码的 appId

## 测试结构

```
test/
├── dsn-api.e2e.test.ts         # 主测试文件（统一的 E2E 测试）
├── helpers/
│   └── test-data.helper.ts     # 测试数据辅助工具
├── setup.ts                     # 测试环境准备脚本
└── README.md                    # 本文档
```

## 测试覆盖

### 1. Health API

-   `GET /monitoring/health` - 健康检查
-   `GET /monitoring/health/diagnostics` - 诊断信息
-   `GET /monitoring/health/recent-events` - 最近事件

### 2. 单个事件接收

-   `POST /monitoring/:appId` - 基础事件
-   `POST /monitoring/:appId` - 完整 SDK 事件（所有字段）
-   `POST /monitoring/:appId` - Performance 事件
-   `POST /monitoring/:appId` - Web Vitals 事件（LCP, FCP, CLS, TTFB）

### 3. 框架特定事件

-   Vue 错误事件（包含组件信息）
-   React 错误事件（包含组件栈）
-   HTTP 错误事件（包含请求详情）
-   资源错误事件（包含资源信息）

### 4. 批量事件接收

-   `POST /monitoring/:appId/batch` - 批量基础事件
-   `POST /monitoring/:appId/batch` - 批量完整事件
-   `POST /monitoring/:appId/batch` - 大批量事件（50+ 条）

### 5. 数据验证

-   空事件对象验证
-   缺少必填字段验证
-   appId 格式验证
-   不存在的 appId 处理

### 6. 特殊字符和编码

-   Unicode 字符处理
-   HTML 特殊字符处理
-   超长消息处理

### 7. 并发和性能

-   并发事件提交
-   响应时间验证

### 8. ClickHouse 数据验证

-   验证事件正确写入数据库
-   数据完整性检查

### 9. 错误场景

-   畸形 JSON 处理
-   批量事件中的部分无效事件

## 运行测试

### 前置条件

确保以下服务正在运行：

```bash
# 1. 启动数据库服务（Docker）
docker compose up -d

# 2. 启动 DSN Server
cd apps/backend/dsn-server
pnpm start:dev

# 3. 启动 Monitor Server（用于创建测试应用）
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

# 运行所有测试
pnpm test
```

## 测试数据管理

### 自动创建

每次测试运行时自动创建：

-   **测试用户**：`test_dsn_<timestamp>`（通过 Monitor Server）
-   **测试应用**：`DSN API Test App`（通过 Monitor Server）
-   **测试事件**：各种类型的测试事件

### 自动清理

测试结束后自动清理：

-   删除测试应用
-   删除测试用户（标记清理）
-   清理 ClickHouse 中的测试事件

### Fallback 机制

如果无法创建测试用户/应用（例如 Monitor Server 未运行），测试会自动使用已存在的应用 ID 进行测试。

## 测试辅助工具

### TestDataHelper

位置：`test/helpers/test-data.helper.ts`

主要功能：

-   `createTestUser()` - 创建测试用户（通过 Monitor Server）
-   `login()` - 登录获取 token
-   `createTestApp()` - 创建测试应用（通过 Monitor Server）
-   `cleanupTestData()` - 清理测试数据
-   `deleteTestApp()` - 删除测试应用
-   `deleteTestUser()` - 删除测试用户
-   `waitForDataSync()` - 等待数据同步

### 静态测试数据生成器

-   `createCompleteEvent()` - 生成完整的测试事件（包含所有 SDK 字段）
-   `createPerformanceEvent()` - 生成 Performance 事件
-   `createWebVitalEvent()` - 生成 Web Vitals 事件
-   `createVueErrorEvent()` - 生成 Vue 错误事件
-   `createReactErrorEvent()` - 生成 React 错误事件
-   `createHttpErrorEvent()` - 生成 HTTP 错误事件
-   `createResourceErrorEvent()` - 生成资源错误事件
-   `createBatchEvents()` - 生成批量测试事件

## 测试最佳实践

### 1. 测试隔离

✅ **正确**：每个测试套件使用独立用户

```typescript
const testUsername = `test_dsn_${Date.now()}`
const { userId, token } = await testHelper.createTestUser(testUsername, 'password')
```

❌ **错误**：使用硬编码的 appId

```typescript
const VALID_APP_ID = 'vanillaV9pEeA' // 不要这样做
```

### 2. 状态码期望

✅ **正确**：期望成功的状态码

```typescript
expect([200, 201]).toContain(status)
```

❌ **错误**：期望过多的状态码

```typescript
expect([200, 201, 400, 404]).toContain(status) // 太宽松
```

### 3. 数据准备

✅ **正确**：在 beforeAll 中准备所有数据

```typescript
beforeAll(async () => {
    testUser = await testHelper.createTestUser(...)
    testApp = await testHelper.createTestApp(...)
})
```

❌ **错误**：在每个测试中重复创建数据

```typescript
it('test', async () => {
    const app = await testHelper.createTestApp(...) // 浪费时间
})
```

### 4. 错误处理

✅ **正确**：检查变量是否已初始化

```typescript
afterAll(async () => {
    if (testHelper && testApp) {
        await testHelper.cleanupTestData(testApp.appId)
    }
})
```

❌ **错误**：直接访问可能未初始化的变量

```typescript
afterAll(async () => {
    await testHelper.cleanupTestData(testApp.appId) // 可能是 undefined
})
```

## 常见问题

### Q: 测试失败 "DSN Server 未运行"

**A**: 确保 DSN Server 正在运行：

```bash
cd apps/backend/dsn-server
pnpm start:dev
```

### Q: 测试失败 "Monitor Server 未运行"

**A**: DSN Server 的测试需要 Monitor Server 来创建测试应用。确保 Monitor Server 正在运行：

```bash
cd apps/backend/monitor
pnpm start:dev
```

如果 Monitor Server 不可用，测试会使用 fallback 应用 ID。

### Q: 测试失败 "ClickHouse 连接失败"

**A**: 确保 Docker 容器正在运行：

```bash
docker compose up -d
docker ps | grep clickhouse
```

### Q: 测试失败 "appId 不存在"

**A**: 如果使用 fallback appId，确保该应用在数据库中存在。建议启动 Monitor Server 让测试自动创建应用。

### Q: 事件数据验证失败

**A**: 确认：

1. ClickHouse 表结构正确（运行迁移脚本）
2. DSN Server 正确处理所有 SDK 字段
3. 等待足够的数据同步时间（默认 2 秒）

## 与 Monitor Server 测试的区别

| 特性           | DSN Server           | Monitor Server       |
| -------------- | -------------------- | -------------------- |
| **主要职责**   | 接收 SDK 事件        | 查询和分析事件       |
| **测试重点**   | 数据接收和验证       | API 查询和权限       |
| **认证需求**   | 无（公开接口）       | 有（需要 JWT）       |
| **测试用户**   | 可选（用于创建应用） | 必需（用于权限测试） |
| **数据库操作** | 写入（INSERT）       | 读取（SELECT）       |

## 技术栈

-   **测试框架**: Vitest
-   **HTTP 客户端**: Axios
-   **数据库**: ClickHouse
-   **消息队列**: Bull (Redis)
-   **测试工具**: TestDataHelper

## 维护指南

### 添加新的事件类型测试

在 `dsn-api.e2e.test.ts` 中添加新的测试用例：

```typescript
it('POST /monitoring/:appId - 应该接收新事件类型', async () => {
    const newEvent = {
        type: 'new-type',
        name: 'NewEvent',
        // ... 其他字段
    }

    const { status, data } = await client.post(`/monitoring/${testApp.appId}`, newEvent)

    expect([200, 201]).toContain(status)
    if (status === 200 || status === 201) {
        expect(data.success).toBe(true)
    }
})
```

### 更新测试数据生成器

在 `TestDataHelper` 中添加新的静态方法：

```typescript
static createNewEventType() {
    return {
        ...this.createCompleteEvent(),
        customField: 'custom-value',
        // ... 新字段
    }
}
```

## 性能指标

预期性能：

-   **测试总时长**：< 10 秒
-   **单个事件接收**：< 2 秒
-   **批量事件接收**：< 3 秒
-   **并发请求**：5 个并发请求无失败

## 版本历史

-   **v2.0.0** (2025-01-06): 彻底重构测试架构，统一测试文件
-   **v1.0.0** (2024-12-XX): 初始版本，多个分散的测试文件
