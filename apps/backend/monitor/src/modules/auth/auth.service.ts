import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { v4 as uuidv4 } from 'uuid'

import { AdminService } from '../admin/admin.service'
import { BlacklistService } from './blacklist.service'
import { jwtConstants } from './constants'

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly adminService: AdminService,
        private readonly blacklistService: BlacklistService
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        const admin = await this.adminService.validateUser(username, pass)
        if (admin) {
            const { password, ...result } = admin
            return result
        }
        return null
    }

    async login(user: any): Promise<any> {
        const accessJti = uuidv4()
        const refreshJti = uuidv4()

        const accessPayload = {
            username: user.username,
            sub: user.id,
            jti: accessJti,
        }

        const refreshPayload = {
            username: user.username,
            sub: user.id,
            jti: refreshJti,
        }

        const accessToken = this.jwtService.sign(accessPayload, {
            secret: jwtConstants.secret,
            expiresIn: jwtConstants.accessTokenExpiry,
        })

        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: jwtConstants.refreshSecret,
            expiresIn: jwtConstants.refreshTokenExpiry,
        })

        // 存储 refresh token 到 Redis (7天 = 604800秒)
        await this.blacklistService.storeRefreshToken(user.id, refreshJti, 604800)

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900, // 15分钟 = 900秒
        }
    }

    async refreshToken(refreshToken: string): Promise<any> {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: jwtConstants.refreshSecret,
            })

            // 检查 refresh token 是否有效
            const isValid = await this.blacklistService.isRefreshTokenValid(payload.sub, payload.jti)
            if (!isValid) {
                throw new UnauthorizedException('Refresh token 已失效')
            }

            // 检查用户是否被全局登出
            const isUserBlacklisted = await this.blacklistService.isUserBlacklisted(payload.sub)
            if (isUserBlacklisted) {
                throw new UnauthorizedException('用户已被全局登出')
            }

            // 生成新的 access token
            const newAccessJti = uuidv4()
            const newAccessPayload = {
                username: payload.username,
                sub: payload.sub,
                jti: newAccessJti,
            }

            const newAccessToken = this.jwtService.sign(newAccessPayload, {
                secret: jwtConstants.secret,
                expiresIn: jwtConstants.accessTokenExpiry,
            })

            return {
                access_token: newAccessToken,
                expires_in: 900,
            }
        } catch (error) {
            throw new UnauthorizedException('Refresh token 无效或已过期')
        }
    }

    async logout(userId: number, jti: string): Promise<any> {
        // 将 access token 加入黑名单 (15分钟 = 900秒)
        await this.blacklistService.addTokenToBlacklist(jti, userId, 900)
        return { success: true, message: '登出成功' }
    }

    async logoutAll(userId: number): Promise<any> {
        // 将用户加入黑名单，使所有设备的 token 失效 (7天 = 604800秒)
        await this.blacklistService.addUserToBlacklist(userId, 604800)
        return { success: true, message: '所有设备已登出' }
    }

    async validateToken(jti: string, userId: number): Promise<boolean> {
        // 检查 token 是否在黑名单中
        const isTokenBlacklisted = await this.blacklistService.isTokenBlacklisted(jti)
        if (isTokenBlacklisted) {
            return false
        }

        // 检查用户是否被全局登出
        const isUserBlacklisted = await this.blacklistService.isUserBlacklisted(userId)
        if (isUserBlacklisted) {
            return false
        }

        return true
    }
}
