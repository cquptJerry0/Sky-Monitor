# Sky Monitor SDK - Vanilla JavaScript Demo

## 概述

这是一个完整的 Vanilla JavaScript 测试 Demo，系统性验证 Sky Monitor SDK 的所有功能。

## 功能覆盖

### ✅ 已实现的 8 个核心 Integrations

1. **Errors** - 全局错误捕获
2. **Metrics** - Core Web Vitals (LCP, FCP, CLS, TTFB)
3. **SessionIntegration** - 会话跟踪
4. **HttpErrorIntegration** - HTTP 错误捕获
5. **ResourceErrorIntegration** - 资源加载错误
6. **PerformanceIntegration** - 请求性能监控
7. **SamplingIntegration** - 分层采样
8. **DeduplicationIntegration** - 错误去重

### 🔧 手动功能

-   `addBreadcrumb()` - 手动添加用户行为轨迹
-   `setUser()` - 设置用户信息
-   `setTag()` / `configureScope()` - 设置标签和额外数据

### 📦 传输功能

-   **批量上报** - 20条/批，5秒刷新间隔
-   **离线队列** - localStorage存储，50条限制，10秒重试

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动后端服务

确保 Sky Monitor 后端服务正在运行：

```bash
# DSN Server (端口 8080)
cd apps/backend/dsn-server
pnpm dev

# Monitor API (端口 3000)
cd apps/backend/monitor
pnpm dev
```

### 3. 创建测试应用

在后端数据库中创建测试应用：

```sql
-- PostgreSQL
INSERT INTO applications (app_id, app_name, user_id)
VALUES ('demo_app_001', 'Vanilla Demo', 1);
```

### 4. 启动 Demo

```bash
pnpm dev
```

访问 http://localhost:5173

## 测试场景

### Integration 测试（8个）

| Integration   | 测试数量 | 说明                                         |
| ------------- | -------- | -------------------------------------------- |
| Errors        | 8        | 同步/异步/Promise/引用/类型/自定义/资源/去重 |
| Metrics       | 4        | LCP/FCP/CLS/TTFB                             |
| Session       | 6        | 创建/持久化/超时/可见性/卸载/指标            |
| HttpError     | 9        | Fetch/XHR 404/500/超时/取消/脱敏/去重        |
| ResourceError | 6        | img/script/link/video/audio/去重             |
| Performance   | 6        | 快速/慢速/失败/并发/XHR/Fetch                |
| Sampling      | 3        | 错误采样/性能采样/元数据                     |
| Deduplication | 3        | 窗口内去重/计数/窗口过期                     |

### 手动功能测试（2个）

| 功能         | 测试数量 | 说明                             |
| ------------ | -------- | -------------------------------- |
| Breadcrumb   | 5        | 点击/API/导航/附加/限制          |
| User Context | 4        | setUser/setTag/setExtra/全局附加 |

### 传输功能测试（2个）

| 功能     | 测试数量 | 说明                       |
| -------- | -------- | -------------------------- |
| Batching | 3        | 批量触发/批次大小/刷新间隔 |
| Offline  | 4        | 网络断开/存储/限制/重试    |

### SourceMap 测试（1个）

| 功能      | 测试数量 | 说明                    |
| --------- | -------- | ----------------------- |
| SourceMap | 4        | 配置/触发/上传/状态查询 |

**总计：61 个测试场景**

## 验证方法

### 1. 前端验证

打开浏览器开发者工具：

-   **Console** - 查看 SDK 初始化日志
-   **Network** - 观察批量上报请求
-   **Application** - 查看 localStorage 离线队列

### 2. 后端验证

#### ClickHouse 查询

```sql
-- 查看事件类型分布
SELECT event_type, COUNT(*) as count
FROM monitor_events
WHERE app_id = 'demo_app_001'
GROUP BY event_type;

-- 查看会话数据
SELECT
    session_id,
    session_event_count,
    COUNT(*) as actual_events
FROM monitor_events
WHERE app_id = 'demo_app_001'
GROUP BY session_id, session_event_count;

-- 查看错误详情
SELECT
    event_id,
    error_message,
    error_stack,
    error_fingerprint,
    dedup_count
FROM monitor_events
WHERE app_id = 'demo_app_001'
  AND event_type = 'error'
ORDER BY timestamp DESC
LIMIT 10;
```

#### 验证脚本

```bash
node scripts/verify-data.js
```

### 3. SourceMap 验证

```bash
# 构建 Demo
pnpm build

# 查看 SourceMap 上传（如果配置了 vite-plugin）
# 或手动上传
curl -X POST http://localhost:3000/api/sourcemap/upload \
  -H "Content-Type: multipart/form-data" \
  -F "appId=demo_app_001" \
  -F "release=1.0.0-demo" \
  -F "file=@dist/assets/index-xxx.js.map"
```

## 配置说明

### SDK 配置

```javascript
// src/main.js
{
    dsn: 'http://localhost:8080/api/monitoring/demo_app_001',
    appId: 'demo_app_001',
    release: '1.0.0-demo',
    environment: 'development',

    // 批量上报
    enableBatching: true,
    batchSize: 20,
    flushInterval: 5000,

    // 离线队列
    enableOffline: true,
    offlineQueueSize: 50,
    retryInterval: 10000,

    // 采样率（Demo 模式 100%）
    sampleRate: 1.0,
}
```

### Integration 配置

所有 Integration 都已启用并配置为 Demo 模式（100% 采样）。生产环境建议调整采样率：

```javascript
new SamplingIntegration({
    errorSampleRate: 1.0, // 错误 100%
    performanceSampleRate: 0.3, // 性能 30%
})
```

## 常见问题

### Q: 为什么看不到事件上报？

A: 检查以下几点：

1. 后端服务是否正常运行（端口 8080 和 3000）
2. 浏览器 Network 面板是否有请求
3. 是否被采样过滤（检查 sampleRate）
4. 是否触发了去重机制

### Q: 批量上报什么时候发送？

A: 满足以下任一条件：

1. 队列达到 batchSize（20条）
2. 距离上次发送超过 flushInterval（5秒）
3. 页面卸载前（beforeunload）

### Q: 离线队列如何测试？

A:

1. 打开 Network 面板
2. 选择 "Offline" 模拟断网
3. 触发一些事件
4. 查看 localStorage 的 `sky_monitor_offline_queue`
5. 取消 Offline，等待 10 秒观察重试

### Q: SourceMap 测试需要什么？

A:

1. 运行 `pnpm build` 生成压缩代码和 .map 文件
2. 配置 vite-plugin 自动上传（或手动上传）
3. 触发错误，后端自动触发解析队列
4. 查询解析状态和结果

## 文件结构

```
demos/vanilla-demo/
├── index.html                  # 主页面
├── vite.config.js              # Vite 配置（SourceMap）
├── package.json                # 依赖配置
├── src/
│   ├── main.js                 # SDK 初始化
│   └── utils/
│       └── test-helpers.js     # 测试辅助函数
├── scripts/
│   └── verify-data.js          # ClickHouse 验证脚本
├── README.md                   # 本文档
└── test-results.md             # 测试结果模板
```

## 技术栈

-   **前端**: Vanilla JavaScript (ES Modules)
-   **构建**: Vite
-   **SDK**: @sky-monitor/monitor-sdk-browser
-   **后端**: NestJS + ClickHouse + PostgreSQL + Redis

## 贡献

如果发现问题或有改进建议，请创建 Issue 或 Pull Request。

## License

MIT
