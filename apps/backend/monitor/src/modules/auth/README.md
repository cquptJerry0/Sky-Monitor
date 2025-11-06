# 双 Token + 黑名单认证系统

## 架构设计

采用 **双 Token（Access Token + Refresh Token）+ Redis 黑名单** 的认证方案，提供安全且灵活的用户认证机制。

### Token 类型

| Token 类型    | 有效期  | 用途              | 存储位置       |
| ------------- | ------- | ----------------- | -------------- |
| Access Token  | 15 分钟 | API 访问权限凭证  | 客户端（内存） |
| Refresh Token | 7 天    | 刷新 Access Token | 客户端（安全） |

### Redis 黑名单设计

```typescript
// Token 级黑名单（单设备登出）
blacklist:token:{jti}        TTL: 900秒（15分钟）

// User 级黑名单（全局登出）
blacklist:user:{userId}      TTL: 604800秒（7天）

// Refresh Token 存储
refresh:{userId}:{jti}       TTL: 604800秒（7天）
```

## API 端点

### 1. 登录

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**成功响应：**

```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_in": 900
    }
}
```

### 2. 刷新 Token

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**成功响应：**

```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires_in": 900
    }
}
```

### 3. 登出当前设备

```http
POST /auth/logout
Authorization: Bearer {access_token}
```

**成功响应：**

```json
{
    "success": true,
    "message": "登出成功"
}
```

### 4. 登出所有设备

```http
POST /auth/logout-all
Authorization: Bearer {access_token}
```

**成功响应：**

```json
{
    "success": true,
    "message": "所有设备已登出"
}
```

## 核心组件

### BlacklistService

-   管理 Redis 黑名单
-   支持 Token 级和 User 级黑名单
-   管理 Refresh Token 生命周期

### AuthService

-   用户认证逻辑
-   双 Token 生成
-   Token 刷新机制
-   黑名单管理

### JwtStrategy

-   JWT 验证
-   黑名单检查
-   自动拦截失效 Token

## 安全特性

1. **短期 Access Token**: 15 分钟有效期，减少被窃取风险
2. **长期 Refresh Token**: 7 天有效期，提供良好用户体验
3. **JTI 唯一标识**: 每个 Token 都有唯一 ID，支持精确控制
4. **双层黑名单**: 支持单设备登出和全局登出
5. **Redis 自动过期**: TTL 机制自动清理过期黑名单

## 使用场景

### 场景 1: 正常登录和访问

1. 用户登录 → 获取双 Token
2. 使用 Access Token 访问 API
3. Access Token 过期前自动刷新
4. 重复步骤 2-3

### 场景 2: 单设备登出

1. 用户点击"登出"
2. 当前 Access Token 加入黑名单
3. 其他设备不受影响

### 场景 3: 全局登出（安全事件）

1. 用户点击"登出所有设备"
2. User ID 加入黑名单
3. 所有设备的 Token 立即失效
4. 所有 Refresh Token 失效

### 场景 4: Token 刷新

1. Access Token 即将过期
2. 客户端使用 Refresh Token 获取新 Access Token
3. 继续使用新 Token 访问 API

## 测试

### 运行单元测试

```bash
pnpm test src/modules/auth/auth.service.spec.ts
```

### 运行 E2E 测试

```bash
pnpm test:setup && pnpm test test/auth.e2e.test.ts
```

## 配置

配置文件：`src/modules/auth/constants.ts`

```typescript
export const jwtConstants = {
    secret: 'secretKey', // Access Token 密钥
    refreshSecret: 'refreshSecretKey', // Refresh Token 密钥
    accessTokenExpiry: '15m', // Access Token 有效期
    refreshTokenExpiry: '7d', // Refresh Token 有效期
}
```

## 依赖

-   `@nestjs/jwt`: JWT 生成和验证
-   `@nestjs/passport`: 认证策略
-   `passport-jwt`: JWT Passport 策略
-   `uuid`: 生成 JTI 唯一标识
-   `ioredis`: Redis 客户端

## 注意事项

1. **生产环境**: 请更换 `jwtConstants.secret` 和 `jwtConstants.refreshSecret` 为强密钥
2. **Redis 连接**: 确保 Redis 服务可用且正确配置密码
3. **Token 存储**: 客户端应安全存储 Refresh Token（如 HttpOnly Cookie）
4. **HTTPS**: 生产环境必须使用 HTTPS 传输 Token
5. **过期时间**: 根据业务需求调整 Token 有效期

## 版本

-   **版本**: 1.0.0
-   **更新时间**: 2025-11-06
-   **作者**: Sky Monitor Team
