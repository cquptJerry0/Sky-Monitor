# Sky Monitor

前端监控系统，包含SDK、数据收集服务和管理后台。

## 技术栈

### SDK (packages/)

-   **Core**: TypeScript，事件管道、Integration机制
-   **Browser**: Fetch传输、批量上报、离线队列、rrweb会话录制
-   **Browser Utils**: Web Vitals性能指标

### 后端服务 (apps/backend/)

-   **DSN Server**: NestJS，数据接收和处理，端口8080
-   **Monitor Server**: NestJS，管理API和认证，端口8081
-   **数据存储**: ClickHouse（事件数据）、PostgreSQL（应用/用户）、Redis（队列）
-   **异步任务**: Bull队列，SourceMap解析

### 前端管理平台 (apps/frontend/monitor/)

-   React 18 + Vite
-   React Router v6
-   TailwindCSS + Radix UI
-   TanStack Query

## 功能

### 错误监控

-   同步/异步/Promise错误捕获
-   资源加载错误（图片、脚本、CSS等）
-   HTTP请求错误（Fetch/XHR）
-   错误指纹去重
-   SourceMap还原堆栈

### 性能监控

-   Web Vitals（LCP、FCP、CLS、TTFB）
-   请求耗时（慢请求>3秒）
-   资源加载性能（DNS、TCP、TTFB）

### 会话追踪

-   自动生成Session ID
-   会话超时管理（30分钟）
-   错误时会话录制（rrweb）

### 用户行为

-   面包屑轨迹（Console、DOM、Fetch、XHR、路由）
-   用户上下文（ID、邮箱、自定义标签）

### 数据优化

-   分层采样（错误/性能可配置采样率）
-   错误去重（5秒窗口）
-   批量上报（20条/次，5秒刷新）
-   离线队列（断网时存储50条，恢复后重试）

## 快速开始

```bash
pnpm docker:start
pnpm dev:all
```
