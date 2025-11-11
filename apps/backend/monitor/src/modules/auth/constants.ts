/**
 * JWT 配置常量
 *
 * 安全说明：
 * - 密钥必须从环境变量读取，不能硬编码
 * - 生产环境必须使用强随机密钥（至少 32 字符）
 * - 使用 scripts/generate-jwt-secrets.js 生成密钥
 */
export const jwtConstants = {
    // 从环境变量读取密钥，如果未设置则抛出错误
    secret:
        process.env.JWT_SECRET ||
        (() => {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET 环境变量未设置！生产环境必须设置强密钥。')
            }
            console.warn('⚠️  警告: JWT_SECRET 未设置，使用默认值（仅限开发环境）')
            return 'dev-secret-key-do-not-use-in-production'
        })(),

    refreshSecret:
        process.env.JWT_REFRESH_SECRET ||
        (() => {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_REFRESH_SECRET 环境变量未设置！生产环境必须设置强密钥。')
            }
            console.warn('⚠️  警告: JWT_REFRESH_SECRET 未设置，使用默认值（仅限开发环境）')
            return 'dev-refresh-secret-key-do-not-use-in-production'
        })(),

    // Token 过期时间配置
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
}

// Cookie 配置
export const cookieConstants = {
    httpOnly: process.env.COOKIE_HTTP_ONLY === 'false' ? false : true, // 默认 true
    secure: process.env.COOKIE_SECURE === 'true', // 生产环境应该为 true
    sameSite: (process.env.COOKIE_SAME_SITE || 'strict') as 'strict' | 'lax' | 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7天（毫秒）
    path: '/api/auth/refresh', // 限制 Cookie 的使用路径
}
