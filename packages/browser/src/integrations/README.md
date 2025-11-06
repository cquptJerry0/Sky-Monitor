# Breadcrumb Integration

## 概述

`BreadcrumbIntegration` 是一个自动采集用户行为轨迹的集成，能够记录用户在应用中的操作路径，包括：

-   **路由变化**: 监听 SPA 应用的路由跳转
-   **DOM 交互**: 捕获用户点击事件
-   **Console 日志**: 拦截并记录 console 输出
-   **HTTP 请求**: 记录所有 Fetch 和 XHR 请求

## 使用方法

### 基本用法

```typescript
import { init, BreadcrumbIntegration } from '@sky-monitor/monitor-sdk-browser'

const monitoring = await init({
    dsn: 'http://localhost:8080/api/monitoring/your-app-id',
    integrations: [
        new BreadcrumbIntegration({
            console: true, // 启用 console 日志捕获
            dom: true, // 启用 DOM 点击事件捕获
            fetch: true, // 启用 Fetch 请求捕获
            history: true, // 启用路由变化捕获
            xhr: true, // 启用 XHR 请求捕获
        }),
    ],
})
```

### 配置选项

| 选项      | 类型      | 默认值 | 说明                                                |
| --------- | --------- | ------ | --------------------------------------------------- |
| `console` | `boolean` | `true` | 是否捕获 console 日志（log/warn/error/info/debug）  |
| `dom`     | `boolean` | `true` | 是否捕获 DOM 点击事件                               |
| `fetch`   | `boolean` | `true` | 是否捕获 Fetch 请求                                 |
| `history` | `boolean` | `true` | 是否捕获路由变化（pushState/replaceState/popstate） |
| `xhr`     | `boolean` | `true` | 是否捕获 XHR 请求                                   |

### 仅启用特定功能

```typescript
// 只捕获 console 和 HTTP 请求，不捕获 DOM 事件和路由
new BreadcrumbIntegration({
    console: true,
    dom: false,
    fetch: true,
    history: false,
    xhr: true,
})
```

## 面包屑类型

### 1. Navigation (路由变化)

```json
{
    "category": "navigation",
    "message": "Navigation: /home -> /about",
    "level": "info",
    "timestamp": 1699999999999,
    "data": {
        "from": "/home",
        "to": "/about",
        "state": {}
    }
}
```

### 2. UI (用户交互)

```json
{
    "category": "ui",
    "message": "Clicked: button#submit-btn",
    "level": "info",
    "timestamp": 1699999999999,
    "data": {
        "selector": "button#submit-btn",
        "text": "Submit"
    }
}
```

### 3. Console (控制台日志)

```json
{
    "category": "console",
    "message": "console.error: User not found",
    "level": "error",
    "timestamp": 1699999999999,
    "data": {
        "method": "error",
        "args": ["User not found"]
    }
}
```

### 4. HTTP (网络请求)

```json
{
    "category": "http",
    "message": "Fetch: GET /api/users 200",
    "level": "info",
    "timestamp": 1699999999999,
    "data": {
        "url": "/api/users",
        "method": "GET",
        "status": 200,
        "statusText": "OK",
        "duration": 150
    }
}
```

## 面包屑的作用

面包屑会自动附加到每个错误事件中，帮助你：

1. **追踪用户操作路径**: 了解错误发生前用户做了什么
2. **重现问题**: 通过操作序列重现 bug
3. **定位根因**: 识别导致错误的具体操作

### 示例：错误事件中的面包屑

```javascript
// 用户操作序列
console.log('步骤 1: 用户查看页面')
// → 生成 console 面包屑

document.querySelector('#login-btn').click()
// → 生成 ui 面包屑

await fetch('/api/login', { method: 'POST' })
// → 生成 http 面包屑

throw new Error('Login failed')
// → 错误事件包含上述所有面包屑
```

错误事件数据：

```json
{
    "type": "error",
    "message": "Login failed",
    "breadcrumbs": [
        {
            "category": "console",
            "message": "console.log: 步骤 1: 用户查看页面",
            "level": "info",
            "timestamp": 1699999999990
        },
        {
            "category": "ui",
            "message": "Clicked: button#login-btn",
            "level": "info",
            "timestamp": 1699999999995
        },
        {
            "category": "http",
            "message": "Fetch: POST /api/login 401",
            "level": "warning",
            "timestamp": 1700000000000
        }
    ]
}
```

## 注意事项

1. **性能影响**: 面包屑采集对性能的影响 < 5%
2. **存储限制**: Scope 默认最多保留 100 条面包屑
3. **隐私安全**:
    - Console 日志仅记录前 3 个参数
    - HTTP 请求不记录 body 内容
    - 避免记录敏感信息

## 最佳实践

### 1. 结合其他集成使用

```typescript
new BreadcrumbIntegration(), // 用户行为追踪
    new SessionIntegration(), // 会话追踪
    new DeduplicationIntegration() // 错误去重
```

### 2. 生产环境优化

```typescript
// 生产环境：减少数据量，只保留关键信息
new BreadcrumbIntegration({
    console: false, // 关闭 console，减少噪音
    dom: true, // 保留用户交互
    fetch: true, // 保留 HTTP 请求
    history: true, // 保留路由变化
    xhr: true,
})
```

### 3. 开发环境

```typescript
// 开发环境：全量采集，方便调试
new BreadcrumbIntegration({
    console: true,
    dom: true,
    fetch: true,
    history: true,
    xhr: true,
})
```

## 测试

运行单元测试：

```bash
cd packages/browser
pnpm test breadcrumb
```

运行集成测试：

```bash
cd demos/vanilla-demo
pnpm dev
# 打开浏览器访问测试页面，点击 "面包屑追踪测试" 区域的按钮
```

## 故障排查

### 问题：面包屑未记录

1. 检查配置是否正确启用
2. 确认 `setupOnce()` 已被调用
3. 检查控制台是否有错误

### 问题：console 输出被拦截

-   原始的 console 方法仍会正常调用
-   不影响其他工具（如 Chrome DevTools）

### 问题：HTTP 请求未记录

-   确保请求是通过 `fetch` 或 `XMLHttpRequest` 发起的
-   第三方库（如 axios）的请求也会被捕获
