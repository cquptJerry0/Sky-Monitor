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

# @sky-monitor/monitor-sdk-browser

浏览器端监控 SDK，提供错误捕获、性能监控、会话重放等功能。

## 安装

```bash
pnpm add @sky-monitor/monitor-sdk-browser
```

## 快速开始

```typescript
import { init, Errors, Metrics, SessionReplayIntegration } from '@sky-monitor/monitor-sdk-browser'

const monitoring = init({
    dsn: 'http://your-server.com/api/v1/monitoring/your-project-id',
    integrations: [
        new Errors(),
        new Metrics(),
        new SessionReplayIntegration({
            mode: 'onError',
        }),
    ],
})
```

## 功能特性

### 1. 错误监控

自动捕获并上报 JavaScript 错误、Promise rejections、资源加载失败等。

```typescript
import { init, Errors, captureException } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [new Errors()],
})

// 手动捕获异常
try {
    throw new Error('Something went wrong')
} catch (error) {
    captureException(error)
}
```

### 2. 性能监控

基于 Web Vitals 标准，监控 CLS、LCP、FCP、FID、INP、TTFB 等核心指标。

```typescript
import { init, Metrics } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        new Metrics({
            enableCLS: true,
            enableLCP: true,
            enableFCP: true,
            enableFID: true,
            enableINP: true,
            enableTTFB: true,
        }),
    ],
})
```

### 3. Session Replay（会话重放）⭐

录制用户会话，在错误发生时回放用户操作，快速定位问题。

#### 基础用法

```typescript
import { init, SessionReplayIntegration } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        new SessionReplayIntegration({
            // 录制模式（推荐使用 onError）
            mode: 'onError',

            // 保留最近 60 秒的录制数据
            maxBufferDuration: 60,

            // 错误发生后继续录制 10 秒
            postErrorDuration: 10,

            // 遮罩所有输入框内容（保护隐私）
            maskAllInputs: true,

            // 录制帧率（降低可减少性能开销）
            fps: 10,
        }),
    ],
})
```

#### 录制模式说明

**1. onError 模式（推荐）**

-   ✅ **性能友好**：仅在错误发生时上报数据
-   ✅ **高价值**：捕获错误前 60 秒 + 错误后 10 秒
-   ✅ **低成本**：不增加服务器存储压力

```typescript
new SessionReplayIntegration({
    mode: 'onError',
    maxBufferDuration: 60,
    postErrorDuration: 10,
})
```

**2. always 模式**

-   ⚠️ **高开销**：全程录制并上报
-   ⚠️ **大流量**：产生大量数据传输
-   ✅ **适用场景**：关键页面、VIP 用户

```typescript
new SessionReplayIntegration({
    mode: 'always',
})
```

**3. sampled 模式**

-   ✅ **可控成本**：按采样率录制
-   ✅ **适用场景**：生产环境大规模监控

```typescript
new SessionReplayIntegration({
    mode: 'sampled',
    sampleRate: 0.1, // 10% 用户会话被录制
})
```

#### 隐私保护

Session Replay 提供多种隐私保护机制：

```typescript
new SessionReplayIntegration({
    // 遮罩所有输入框内容
    maskAllInputs: true,

    // 遮罩所有文本内容
    maskAllText: false,

    // 完全隐藏的元素（添加此 class 的元素会被替换为占位符）
    blockClass: 'sky-monitor-block',

    // 遮罩文本的元素（文本会被 *** 替换）
    maskTextClass: 'sky-monitor-mask',

    // 忽略的元素（不会被录制）
    ignoreClass: 'sky-monitor-ignore',
})
```

在 HTML 中使用：

```html
<!-- 完全隐藏敏感区域 -->
<div class="sky-monitor-block">
    <h2>敏感信息</h2>
    <p>信用卡号：1234 5678 9012 3456</p>
</div>

<!-- 遮罩文本内容 -->
<div class="sky-monitor-mask">用户私密信息</div>

<!-- 忽略不需要录制的内容 -->
<div class="sky-monitor-ignore">
    <video src="large-video.mp4"></video>
</div>
```

#### 性能优化

```typescript
new SessionReplayIntegration({
    // 限制录制帧率（默认 10fps）
    fps: 10,

    // 限制最大事件数量（防止内存溢出）
    maxEvents: 1000,

    // 限制单次上报数据大小（默认 2MB）
    maxUploadSize: 2 * 1024 * 1024,

    // 启用数据压缩（需要安装 pako）
    enableCompression: false,

    // 使用 sessionStorage 缓存（页面刷新保留数据）
    useSessionStorage: true,
})
```

#### 高级配置

**自定义 rrweb 插件**

```typescript
import { SessionReplayIntegration } from '@sky-monitor/monitor-sdk-browser'
import type { RecordPlugin } from 'rrweb'

const customPlugin: RecordPlugin = {
    name: 'custom-plugin',
    observer: cb => {
        // 自定义逻辑
    },
}

new SessionReplayIntegration({
    plugins: [customPlugin],
})
```

**获取录制状态**

```typescript
const replayIntegration = new SessionReplayIntegration({ mode: 'onError' })

// 初始化后
init({
    dsn: 'your-dsn',
    integrations: [replayIntegration],
})

// 获取当前状态
const status = replayIntegration.getStatus()
console.log('Is recording:', status.isRecording)
console.log('Event count:', status.eventCount)
console.log('Buffer duration:', status.bufferDuration)
console.log('Estimated size:', status.estimatedSize)
```

### 4. HTTP 错误监控

自动捕获 fetch 和 XHR 请求失败。

```typescript
import { init, HttpErrorIntegration } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        new HttpErrorIntegration({
            // 捕获成功的请求（默认只捕获失败）
            captureSuccessfulRequests: false,

            // 捕获请求头和响应头
            captureHeaders: true,

            // 捕获请求体和响应体
            captureBody: false,

            // 被视为失败的状态码
            failedStatusCodes: [400, 401, 403, 404, 500, 502, 503, 504],
        }),
    ],
})
```

### 5. 资源加载错误

监控静态资源（图片、脚本、样式等）加载失败。

```typescript
import { init, ResourceErrorIntegration } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        new ResourceErrorIntegration({
            // 监听的资源类型
            resourceTypes: ['img', 'script', 'link', 'video', 'audio'],
        }),
    ],
})
```

### 6. 会话追踪

自动为每个用户会话分配 ID，统计会话指标。

```typescript
import { init, SessionIntegration } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        new SessionIntegration({
            // 会话超时时间（30分钟无活动）
            sessionTimeout: 30 * 60 * 1000,
        }),
    ],
})
```

### 7. 采样和去重

控制上报数据量，避免重复错误。

```typescript
import { init, SamplingIntegration, DeduplicationIntegration } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        // 采样：只上报部分事件
        new SamplingIntegration({
            errorSampleRate: 1.0, // 错误 100% 上报
            performanceSampleRate: 0.3, // 性能事件 30% 上报
        }),

        // 去重：相同错误 10 秒内只上报一次
        new DeduplicationIntegration({
            timeWindow: 10000,
        }),
    ],
})
```

### 8. 用户上下文

设置用户信息、标签、额外数据，丰富错误上下文。

```typescript
import { setUser, setTag, addBreadcrumb, configureScope } from '@sky-monitor/monitor-sdk-browser'

// 设置用户信息
setUser({
    id: '12345',
    email: 'user@example.com',
    username: 'john_doe',
})

// 设置标签（用于分类和过滤）
setTag('environment', 'production')
setTag('version', '1.2.3')

// 添加面包屑（记录用户操作）
addBreadcrumb({
    message: 'User clicked login button',
    category: 'ui.click',
    level: 'info',
})

// 配置 Scope（高级用法）
configureScope(scope => {
    scope.setExtra('custom_data', { foo: 'bar' })
    scope.setLevel('warning')
})
```

### 9. 批量传输

优化网络请求，减少服务器压力。

```typescript
import { init } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'your-dsn',
    integrations: [
        /* ... */
    ],

    // 启用批量传输（默认 true）
    enableBatching: true,

    // 批次大小（默认 20 个事件）
    batchSize: 20,

    // 刷新间隔（默认 5000ms）
    flushInterval: 5000,
})
```

## 完整示例

```typescript
import {
    init,
    Errors,
    Metrics,
    SessionReplayIntegration,
    HttpErrorIntegration,
    ResourceErrorIntegration,
    SessionIntegration,
    SamplingIntegration,
    DeduplicationIntegration,
    setUser,
    setTag,
    addBreadcrumb,
} from '@sky-monitor/monitor-sdk-browser'

// 初始化监控
const monitoring = init({
    dsn: 'http://localhost:8080/api/v1/monitoring/your-project-id',
    release: '1.0.0',

    integrations: [
        // 错误监控
        new Errors(),

        // 性能监控
        new Metrics(),

        // 会话重放（推荐配置）
        new SessionReplayIntegration({
            mode: 'onError',
            maxBufferDuration: 60,
            postErrorDuration: 10,
            maskAllInputs: true,
            fps: 10,
        }),

        // HTTP 错误
        new HttpErrorIntegration(),

        // 资源错误
        new ResourceErrorIntegration(),

        // 会话追踪
        new SessionIntegration(),

        // 采样
        new SamplingIntegration({
            errorSampleRate: 1.0,
            performanceSampleRate: 0.3,
        }),

        // 去重
        new DeduplicationIntegration(),
    ],

    // 批量传输配置
    enableBatching: true,
    batchSize: 20,
    flushInterval: 5000,
})

// 设置用户信息
setUser({
    id: '12345',
    email: 'user@example.com',
})

// 设置标签
setTag('environment', 'production')
```

## 最佳实践

### Session Replay 使用建议

1. **生产环境推荐 onError 模式**

    - 平衡性能和调试价值
    - 只在需要时上报数据

2. **必须启用隐私保护**

    ```typescript
    new SessionReplayIntegration({
        maskAllInputs: true, // 必须
        maskAllText: false, // 根据业务需求
    })
    ```

3. **合理设置缓冲时长**

    ```typescript
    new SessionReplayIntegration({
        maxBufferDuration: 60, // 60秒足够重现大部分问题
        postErrorDuration: 10, // 捕获错误后的后续操作
    })
    ```

4. **性能优化**

    ```typescript
    new SessionReplayIntegration({
      fps: 10,              // 降低帧率
      maxEvents: 1000,      // 限制事件数
      maxUploadSize: 2MB    // 限制上报大小
    })
    ```

5. **在 HTML 中标记敏感元素**
    ```html
    <input type="password" class="sky-monitor-mask" />
    <div class="sky-monitor-block">敏感内容</div>
    ```

### 错误监控建议

1. **设置有意义的用户信息**

    ```typescript
    setUser({ id, email, username })
    ```

2. **使用面包屑追踪用户路径**

    ```typescript
    addBreadcrumb({
        message: 'User action',
        category: 'ui.click',
    })
    ```

3. **合理使用采样**
    - 错误：100% 上报
    - 性能：10-30% 上报

## TypeScript 支持

所有 API 都提供完整的 TypeScript 类型定义。

```typescript
import type {
    MonitoringEvent,
    ErrorEvent,
    PerformanceEvent,
    Breadcrumb,
    User,
    Scope,
    ReplayData,
    SessionReplayConfig,
} from '@sky-monitor/monitor-sdk-browser'
```

## 浏览器兼容性

-   Chrome >= 60
-   Firefox >= 55
-   Safari >= 12
-   Edge >= 79

Session Replay 功能需要浏览器支持：

-   MutationObserver
-   Blob API
-   sessionStorage (可选)

## 性能影响

-   **错误监控**：几乎无性能影响（< 1ms）
-   **性能监控**：< 5ms
-   **Session Replay (onError 模式)**：
    -   内存占用：约 5-10MB（60秒缓冲区）
    -   CPU 占用：< 5%（10fps）
    -   网络流量：仅错误时上报（< 2MB）

## License

MIT
