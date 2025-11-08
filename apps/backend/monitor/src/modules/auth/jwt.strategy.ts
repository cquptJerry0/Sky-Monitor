import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { AdminService } from '../admin/admin.service'
import { BlacklistService } from './blacklist.service'
import { jwtConstants } from './constants'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name)

    constructor(
        private readonly adminService: AdminService,
        private readonly blacklistService: BlacklistService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        })
    }

    async validate(payload: any) {
        // JWT payload: { username: string, sub: userId, jti: string, iat: number, exp: number }

        // 如果 token 有 jti，进行黑名单检查
        if (payload.jti) {
            try {
                // 检查 token 是否在黑名单中
                const isTokenBlacklisted = await this.blacklistService.isTokenBlacklisted(payload.jti)
                if (isTokenBlacklisted) {
                    throw new UnauthorizedException('Token 已失效')
                }

                // 检查用户是否被全局登出
                const isUserBlacklisted = await this.blacklistService.isUserBlacklisted(payload.sub)
                if (isUserBlacklisted) {
                    throw new UnauthorizedException('用户已被全局登出')
                }
            } catch (error) {
                // 如果黑名单检查失败（如 Redis 连接问题），记录错误但允许通过（降级策略）
                // 生产环境可能需要更严格的策略
                if (error instanceof UnauthorizedException) {
                    throw error
                }
                this.logger.error('Blacklist check failed, allowing token:', error.message)
            }
        }
        // 如果没有 jti，说明是旧版本 token，仍然允许通过（向后兼容）
        // 生产环境可以改为：if (!payload.jti) throw new UnauthorizedException('Token 格式无效')

        return { id: payload.sub, username: payload.username, jti: payload.jti }
    }
}
