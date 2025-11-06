# Sky Monitor Demo 当前状态

生成时间: 2025-01-XX
版本: 1.0.0-demo

## ✅ 已完成的工作

### 1. SDK 配置和初始化

-   ✅ `src/main.js` - SDK 完整配置
    -   启用所有 11 个 Integrations
    -   配置批量上报 (20条/5秒)
    -   配置离线队列 (50条/10秒重试)
    -   100% 采样率 (Demo 模式)
    -   用户上下文设置

### 2. 核心文件

-   ✅ `vite.config.js` - Vite 配置（SourceMap 上传示例）
-   ✅ `README.md` - 完整的说明文档
-   ✅ `test-results.md` - 测试结果模板
-   ✅ `package.json` - 依赖配置

### 3. SDK 功能验证

根据重新阅读代码，确认 SDK 实现状态：

#### ✅ 已实现并已启用的 Integrations (11个)

| #   | Integration                   | 文件位置                                                        | 代码行数 | Demo配置                |
| --- | ----------------------------- | --------------------------------------------------------------- | -------- | ----------------------- |
| 1   | **Errors**                    | `packages/browser/src/tracing/errorsIntegration.ts`             | ~162行   | ✅ 已启用               |
| 2   | **Metrics**                   | `packages/browser-utils/src/integrations/metrics.ts`            | -        | ✅ 已启用               |
| 3   | **SessionIntegration**        | `packages/browser/src/integrations/session.ts`                  | 232行    | ✅ 已启用（30分钟超时） |
| 4   | **HttpErrorIntegration**      | `packages/browser/src/integrations/httpErrorIntegration.ts`     | 345行    | ✅ 已启用（脱敏）       |
| 5   | **ResourceErrorIntegration**  | `packages/browser/src/integrations/resourceErrorIntegration.ts` | 142行    | ✅ 已启用               |
| 6   | **BreadcrumbIntegration**     | `packages/browser/src/integrations/breadcrumb.ts`               | 580行    | ✅ 已启用（自动捕获）   |
| 7   | **SessionReplayIntegration**  | `packages/browser/src/integrations/sessionReplay.ts`            | 421行    | ✅ 已启用（rrweb）      |
| 8   | **SamplingIntegration**       | `packages/core/src/integrations/sampling.ts`                    | -        | ✅ 已启用（100%）       |
| 9   | **DeduplicationIntegration**  | `packages/core/src/integrations/deduplication.ts`               | -        | ✅ 已启用（5秒窗口）    |
| 10  | **PerformanceIntegration**    | `packages/browser/src/tracing/performanceIntegration.ts`        | 237行    | ✅ 已启用（慢请求>3s）  |
| 11  | **ResourceTimingIntegration** | `packages/browser/src/integrations/resourceTiming.ts`           | 268行    | ✅ 已启用（SPA监听）    |

**总代码量**: ~2387+ 行（不含 core 和 browser-utils 包）

#### 手动功能

| 功能       | API                | 状态 |
| ---------- | ------------------ | ---- |
| 添加面包屑 | `addBreadcrumb()`  | ✅   |
| 设置用户   | `setUser()`        | ✅   |
| 设置标签   | `setTag()`         | ✅   |
| 配置作用域 | `configureScope()` | ✅   |

### 4. 后端配置

#### DSN Server 端点

-   ✅ `POST /api/monitoring/:appId` - 单个事件上报
-   ✅ `POST /api/monitoring/:appId/batch` - 批量事件上报
-   ✅ SourceMap 解析队列自动触发
-   ✅ 完整的字段映射和数据验证

#### ClickHouse 字段映射

已确认后端正确映射所有字段：

-   错误: error_message, error_stack, error_fingerprint, dedup_count
-   性能: perf_category, perf_value, perf_is_slow, perf_success
-   Session: session_id, session_event_count, session_error_count
-   用户: user_id, user_email, user_username
-   上下文: tags, extra, breadcrumbs (JSON)
-   设备: device_browser, device_os, device_type
-   网络: network_type, network_rtt
-   HTTP: http_url, http_method, http_status, http_duration
-   资源: resource_url, resource_type

## 📋 待完成的工作

### 高优先级

#### 1. 测试文件创建

由于分支被删除，需要重新创建 13 个测试文件：

-   `src/tests/01-errors.js` - Errors 测试 (8个场景)
-   `src/tests/02-metrics.js` - Metrics 测试 (4个场景)
-   `src/tests/03-session.js` - Session 测试 (6个场景)
-   `src/tests/04-http-error.js` - HttpError 测试 (9个场景)
-   `src/tests/05-resource-error.js` - ResourceError 测试 (6个场景)
-   `src/tests/06-performance.js` - Performance 测试 (6个场景)
-   `src/tests/07-sampling.js` - Sampling 测试 (3个场景)
-   `src/tests/08-deduplication.js` - Deduplication 测试 (3个场景)
-   `src/tests/09-breadcrumb.js` - Breadcrumb 测试 (5个场景)
-   `src/tests/10-user-context.js` - User Context 测试 (4个场景)
-   `src/tests/11-batching.js` - Batching 测试 (3个场景)
-   `src/tests/12-offline.js` - Offline 测试 (4个场景)
-   `src/tests/13-sourcemap.js` - SourceMap 测试 (4个场景)

#### 2. UI 组件

-   `src/ui/test-panel.js` - 测试控制面板
    -   显示所有测试用例
    -   支持单独运行或批量运行
    -   显示测试结果
-   `src/ui/event-monitor.js` - 实时事件监控
    -   显示最近 20 条上报事件
    -   事件类型、时间戳、关键信息
    -   上报状态（成功/失败/批次中）

#### 3. index.html 更新

-   集成测试控制面板 UI
-   集成实时事件监控 UI
-   提供友好的用户界面

### 中优先级

#### 4. 验证脚本

-   `scripts/verify-data.js` - ClickHouse 数据验证
    -   验证所有事件类型都存储
    -   验证字段映射正确
    -   验证 JSON 字段序列化
    -   验证会话数据关联

### 低优先级

#### 5. 其他

-   添加更多测试场景
-   优化 UI 样式
-   添加性能指标监控

## 📝 快速开始 (当前可用功能)

### 1. 安装依赖

```bash
cd demos/vanilla-demo
pnpm install
```

### 2. 启动后端服务

```bash
# DSN Server (端口 8080)
cd apps/backend/dsn-server
pnpm dev

# Monitor API (端口 3000)
cd apps/backend/monitor
pnpm dev
```

### 3. 创建测试应用

```sql
-- PostgreSQL
INSERT INTO applications (app_id, app_name, user_id)
VALUES ('demo_app_001', 'Vanilla Demo', 1);
```

### 4. 启动 Demo

```bash
cd demos/vanilla-demo
pnpm dev
```

访问 http://localhost:5173

### 5. 验证SDK初始化

打开浏览器控制台，应该看到：

```
🚀 初始化 Sky Monitor SDK...
📝 配置信息: {appId: "demo_app_001", ...}
✅ Sky Monitor SDK 初始化成功
📊 已启用的 Integrations:
  ✓ Errors - 全局错误捕获
  ✓ Metrics - Core Web Vitals (LCP, FCP, CLS, TTFB)
  ✓ SessionIntegration - 会话跟踪（30分钟超时）
  ... (共11个)
```

### 6. 手动触发事件

在浏览器控制台执行：

```javascript
// 触发错误
throw new Error('测试错误')

// 添加面包屑
addBreadcrumb({ message: '测试面包屑', category: 'test' })

// 设置用户
setUser({ id: '123', username: 'test' })
```

### 7. 验证后端接收

查询 ClickHouse：

```sql
SELECT event_type, COUNT(*) as count
FROM monitor_events
WHERE app_id = 'demo_app_001'
GROUP BY event_type;
```

## 🔍 已知问题

1. **测试文件缺失** - 需要重新创建所有测试文件
2. **UI组件缺失** - 需要创建测试控制面板和事件监控 UI
3. **验证脚本缺失** - 需要创建 ClickHouse 数据验证脚本

## 🎯 下一步行动

### 立即可做的事情

1. 重新创建测试文件（参考 `DEMO_STATUS.md` 中的场景列表）
2. 创建简单的 UI 界面进行手动测试
3. 编写 ClickHouse 查询验证数据完整性

### 测试方法（无UI情况下）

使用浏览器控制台手动测试：

```javascript
// 1. 错误测试
throw new Error('同步错误测试')
Promise.reject('Promise拒绝测试')

// 2. HTTP 错误测试
fetch('https://httpstat.us/404')
fetch('https://httpstat.us/500')

// 3. 资源错误测试
const img = new Image()
img.src = 'https://nonexistent-domain.com/test.png'

// 4. 面包屑测试
addBreadcrumb({ message: '用户点击', category: 'ui.click' })
throw new Error('附带面包屑的错误')

// 5. 用户上下文测试
setUser({ id: '123', email: 'test@example.com' })
setTag('version', '1.0.0')
throw new Error('附带用户上下文的错误')
```

## 📊 测试覆盖统计

| 类别             | Integration数量 | 测试场景数 | 文件状态      |
| ---------------- | --------------- | ---------- | ------------- |
| Integration 测试 | 8               | 45         | ❌ 待创建     |
| 手动功能测试     | 2               | 9          | ❌ 待创建     |
| 传输功能测试     | 2               | 7          | ❌ 待创建     |
| SourceMap 测试   | 1               | 4          | ❌ 待创建     |
| **总计**         | **13**          | **65**     | **❌ 待创建** |

## 📚 参考文档

-   [SDK 导出的 API](packages/browser/src/index.ts)
-   [DSN Server 端点](apps/backend/dsn-server/src/modules/monitoring/)
-   [ClickHouse 字段映射](apps/backend/dsn-server/src/modules/monitoring/monitoring.service.ts)
-   [Integration 实现目录](packages/browser/src/integrations/)
-   [测试计划](backend-refactor.plan.md)

## 🤝 贡献指南

如果需要完善 Demo，建议按以下顺序：

1. 创建核心测试文件 (01-08)
2. 创建手动功能测试文件 (09-10)
3. 创建传输功能测试文件 (11-12)
4. 创建 SourceMap 测试文件 (13)
5. 创建 UI 组件
6. 创建验证脚本
7. 运行完整测试并填写 test-results.md

---

**状态**: 🟡 部分完成 - SDK 配置完整，测试文件待创建

**最后更新**: 2025-01-XX
