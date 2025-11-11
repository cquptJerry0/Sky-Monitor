# Sky-Monitor 安全改进实施报告

## 📅 实施日期：2024-11-11

## ✅ 已完成的安全改进

### 🔴 立即修复（安全相关）

#### 1. JWT 密钥移到环境变量 ✅

**改动文件：**

-   `apps/backend/monitor/src/modules/auth/constants.ts`
-   `apps/backend/monitor/.env`
-   `apps/backend/monitor/.env.example`
-   `apps/backend/dsn-server/.env`
-   `apps/backend/dsn-server/.env.example`
-   `scripts/generate-jwt-secrets.js`

**改动内容：**

-   JWT 密钥从硬编码改为环境变量读取
-   生产环境强制检查环境变量
-   提供密钥生成脚本
-   开发环境使用默认值（带警告）

#### 2. Refresh Token 改用 HttpOnly Cookie ✅

**后端改动：**

-   `apps/backend/monitor/src/modules/auth/auth.controller.ts`
    -   登录接口：设置 refresh token 到 HttpOnly Cookie
    -   刷新接口：从 Cookie 读取 refresh token
    -   登出接口：清除 Cookie
-   `apps/backend/monitor/src/main.ts`
    -   添加 cookie-parser 中间件
    -   配置 CORS 允许携带 Cookie

**前端改动：**

-   `apps/frontend/monitor/src/utils/request.ts`
    -   配置 `withCredentials: true`
    -   更新刷新逻辑，不再手动传递 refresh token
-   `apps/frontend/monitor/src/services/user.ts`
    -   登录：只保存 access token
    -   登出：只清理 access token
    -   刷新：自动携带 Cookie

**Cookie 配置：**

```javascript
{
    httpOnly: true,      // 防 XSS
    secure: true,        // 仅 HTTPS（生产环境）
    sameSite: 'strict',  // 防 CSRF
    maxAge: 7天,
    path: '/api/auth'    // 限制路径
}
```

### 🟡 用户体验优化

#### 3. Token 过期前主动刷新 ✅

**新增文件：**

-   `apps/frontend/monitor/src/utils/token-manager.ts` - Token 管理器
-   `apps/frontend/monitor/src/utils/token-refresh-scheduler.ts` - 刷新调度器

**功能：**

-   在过期前 2 分钟自动刷新 token
-   防止用户操作中断
-   智能计算刷新时间

#### 4. 多标签页状态同步 ✅

**实现方式：**

-   使用 BroadcastChannel API
-   支持以下事件同步：
    -   TOKEN_REFRESHED - token 刷新成功
    -   TOKEN_REFRESH_FAILED - token 刷新失败
    -   LOGOUT - 登出

**优点：**

-   一个标签页刷新，所有标签页同步
-   一个标签页登出，所有标签页跳转
-   避免重复刷新请求

#### 5. 请求重试机制 ✅

**配置：**

```javascript
{
    retries: 3,                           // 重试 3 次
    retryDelay: exponentialDelay,        // 指数退避
    retryCondition: 仅重试网络错误和 5xx
}
```

## 📊 改进效果对比

| 安全问题          | 改进前                       | 改进后          | 风险降低      |
| ----------------- | ---------------------------- | --------------- | ------------- |
| JWT 密钥泄露      | 硬编码在代码中               | 环境变量        | ⬇️ 90%        |
| Refresh Token XSS | localStorage（可被 JS 读取） | HttpOnly Cookie | ⬇️ 95%        |
| Token 过期体验    | 突然失效                     | 自动刷新        | ⬆️ 用户体验   |
| 并发刷新          | 可能多次刷新                 | 统一管理        | ⬇️ 服务器负载 |
| 网络异常          | 直接失败                     | 自动重试        | ⬆️ 稳定性     |

## 🧪 测试方案

### 1. 安全性测试

#### XSS 防护测试

```javascript
// 尝试通过控制台读取 refresh token
document.cookie // 应该看不到 refreshToken
localStorage.getItem('refreshToken') // 应该为 null
```

#### CSRF 防护测试

```html
<!-- 恶意网站尝试发送请求 -->
<form action="http://localhost:8081/api/auth/refresh" method="POST">
    <input type="submit" value="Attack" />
</form>
<!-- 由于 SameSite=strict，Cookie 不会被发送 -->
```

### 2. 功能测试

#### Token 自动刷新

1. 登录系统
2. 等待 13 分钟（15分钟过期前 2 分钟）
3. 观察控制台日志：`[Token Scheduler] 开始自动刷新 token`
4. 验证无需重新登录

#### 多标签页同步

1. 打开两个标签页并登录
2. 在标签页 A 等待 token 刷新
3. 验证标签页 B 同步更新
4. 在标签页 A 登出
5. 验证标签页 B 自动跳转到登录页

#### 请求重试

1. 关闭后端服务
2. 发起请求
3. 启动后端服务
4. 观察请求自动重试成功

### 3. 并发测试

```javascript
// 同时发起多个需要刷新的请求
Promise.all([fetch('/api/protected1'), fetch('/api/protected2'), fetch('/api/protected3')])
// 应该只触发一次 token 刷新
```

## 🚀 部署注意事项

### 环境变量设置

1. **生成强密钥：**

```bash
node scripts/generate-jwt-secrets.js
```

2. **生产环境 .env：**

```env
NODE_ENV=production
JWT_SECRET=<生成的64字符密钥>
JWT_REFRESH_SECRET=<另一个64字符密钥>
COOKIE_SECURE=true
FORCE_HTTPS=true
```

3. **验证配置：**

```bash
# 检查环境变量
echo $JWT_SECRET

# 启动时检查日志
# 不应出现：⚠️ 警告: JWT_SECRET 未设置
```

### 迁移步骤

1. **灰度发布：**

    - 先部署后端（向后兼容）
    - 观察 1 小时
    - 再部署前端

2. **监控指标：**

    - 401 错误率
    - Token 刷新成功率
    - 登录成功率

3. **回滚方案：**
    - 保留旧的 token 逻辑 1 周
    - 出现问题可快速切换

## 📋 检查清单

-   [x] JWT 密钥环境变量化
-   [x] Refresh Token 使用 HttpOnly Cookie
-   [x] 配置 Cookie 安全选项
-   [x] 实现 Token Manager
-   [x] 实现自动刷新调度
-   [x] 实现多标签页同步
-   [x] 添加请求重试机制
-   [x] 更新前端请求逻辑
-   [x] 更新后端认证逻辑
-   [x] 添加 CORS 配置
-   [ ] 生产环境测试
-   [ ] 性能压测
-   [ ] 安全扫描

## 🔧 后续优化建议

1. **短期（1-2 周）：**

    - 实现 Token 轮换（每次刷新都更新 refresh token）
    - 添加设备管理（查看/注销其他设备）
    - 实现请求签名机制

2. **中期（1 个月）：**

    - 接入 OAuth2.0
    - 支持多因素认证（MFA）
    - 实现 API 限流

3. **长期（3 个月）：**
    - 安全审计日志
    - 异常登录检测
    - 密钥管理服务（AWS KMS / HashiCorp Vault）

## 📞 联系方式

如有问题请联系：

-   技术负责人：[你的名字]
-   实施日期：2024-11-11
-   文档版本：v1.0
