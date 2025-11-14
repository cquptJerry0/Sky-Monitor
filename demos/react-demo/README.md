# Sky Monitor - E2E Test Demo

完整的 Sky-Monitor SDK Integration 测试平台，覆盖所有 11 个 Integration 的功能测试。

## 技术栈

-   **框架**: React 19.2.0 + TypeScript 5.9.3
-   **构建工具**: Vite 7.2.2
-   **样式**: Tailwind CSS 3.4.14
-   **SDK**: @sky-monitor/monitor-sdk-browser

## 项目结构

```
demos/e2e-demo/
├── src/
│   ├── components/          # 通用组件
│   │   ├── TabNavigation.tsx    # Tab 导航组件
│   │   ├── StepForm.tsx         # 步骤表单组件
│   │   └── TestResults.tsx      # 测试结果显示组件
│   ├── tabs/                # Tab 页面
│   │   ├── OverviewTab.tsx      # SDK 状态概览
│   │   ├── E2ETab.tsx           # E2E 综合测试
│   │   ├── ErrorsTab.tsx        # 错误捕获测试
│   │   ├── BreadcrumbsTab.tsx   # 用户行为轨迹测试
│   │   ├── SessionReplayTab.tsx # 会话录制测试
│   │   ├── PerformanceTab.tsx   # 性能监控测试
│   │   ├── HTTPTab.tsx          # HTTP 和资源错误测试
│   │   └── AdvancedTab.tsx      # 高级功能测试
│   ├── types.ts             # TypeScript 类型定义
│   ├── sdk.ts               # SDK 初始化配置
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 功能特性

### 8 个测试 Tab

1. **Overview** - SDK 状态概览

    - SDK 初始化状态
    - 已加载的 11 个 Integrations
    - TransportRouter 架构展示（Critical/Batch/Replay 三通道）
    - 配置信息展示

2. **E2E Test** - 端到端综合测试

    - 完整的用户操作流程模拟
    - 步骤表单引导测试
    - 验证所有功能协同工作

3. **Errors** - 错误捕获测试

    - JavaScript 错误
    - Promise Rejection
    - 手动捕获错误
    - 自定义消息

4. **Breadcrumbs** - 用户行为轨迹测试

    - 手动添加 Breadcrumb
    - Console 日志采集
    - DOM 交互采集
    - Fetch/XHR 请求采集
    - History 变化采集

5. **Session Replay** - 会话录制测试

    - 错误触发录制
    - 隐私脱敏验证
    - DOM 交互录制

6. **Performance** - 性能监控测试

    - Web Vitals 指标（CLS, LCP, FCP, TTFB）
    - 慢请求监控
    - 资源性能采集

7. **HTTP & Resources** - HTTP 和资源错误测试

    - HTTP 404/500 错误
    - 图片加载错误
    - 脚本加载错误

8. **Advanced** - 高级功能测试
    - 采样功能（SamplingIntegration）
    - 去重功能（DeduplicationIntegration）
    - 会话追踪（SessionIntegration）

## 快速开始

### 1. 安装依赖

```bash
cd demos/e2e-demo
pnpm install
```

### 2. 启动 DSN 服务器

确保 DSN 服务器正在运行：

```bash
cd apps/dsn-server
pnpm dev
```

DSN 服务器应该运行在 `http://localhost:8080`

### 3. 启动 E2E Demo

```bash
cd demos/e2e-demo
pnpm dev
```

应用将在 `http://localhost:5433` 启动

### 4. 开始测试

1. 打开浏览器访问 `http://localhost:5433`
2. 查看 Overview Tab 确认 SDK 已初始化
3. 查看 TransportRouter 架构（Critical/Batch/Replay 三通道）
4. 切换到不同的 Tab 测试各个功能
5. 点击右下角的 "E2E 测试" 按钮进行完整流程测试
6. 打开浏览器控制台查看详细日志
7. 打开 Network 面板查看事件路由到不同端点

## SDK 配置

当前配置（`src/sdk.ts`）：

```typescript
{
  dsn: 'http://localhost:8080/api/monitoring/${appId}',
  appId: 'reactddthD9', // 可在 Overview Tab 修改
  release: '1.0.0-e2e',
  environment: 'development',
  batchSize: 20,        // 批量大小
  flushInterval: 5000,  // 刷新间隔
  // ... 11 个 Integrations
}
```

### TransportRouter 架构

SDK 使用 **TransportRouter** 自动将事件路由到不同端点：

-   **Critical 通道** (`/critical`) - 错误、异常 → 立即发送
-   **Batch 通道** (`/batch`) - WebVital、Performance、Message → 批量发送
-   **Replay 通道** (`/replay`) - Session Replay → 专用通道

## 测试覆盖的 11 个 Integrations

1. **Errors** - 错误捕获
2. **Metrics** - Core Web Vitals
3. **BreadcrumbIntegration** - 用户行为轨迹
4. **SessionReplayIntegration** - 会话录制
5. **HttpErrorIntegration** - HTTP 错误
6. **ResourceErrorIntegration** - 资源错误
7. **PerformanceIntegration** - 性能监控
8. **SessionIntegration** - 会话追踪
9. **ResourceTimingIntegration** - 资源性能
10. **SamplingIntegration** - 采样
11. **DeduplicationIntegration** - 去重

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 注意事项

1. 确保 DSN 服务器正在运行
2. 打开浏览器控制台查看详细日志
3. 某些测试需要网络连接（如 Fetch 测试）
4. Session Replay 在错误触发后 10 秒上报
5. 性能采样率为 30%，部分性能事件可能不会上报

## 故障排查

### SDK 未初始化

-   检查 DSN 服务器是否运行
-   查看控制台错误信息
-   确认 DSN 地址正确

### 测试按钮无响应

-   打开浏览器控制台查看错误
-   检查网络请求是否成功
-   确认 SDK 已正确初始化

### 数据未上报

-   检查 DSN 服务器日志
-   确认采样率配置
-   查看批量上报配置（5 秒刷新间隔）
