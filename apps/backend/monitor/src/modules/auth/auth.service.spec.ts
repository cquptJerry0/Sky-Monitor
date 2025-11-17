import { JwtService } from '@nestjs/jwt'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { AdminService } from '../admin/admin.service'
import { AuthService } from './auth.service'
import { BlacklistService } from './blacklist.service'

describe('AuthService', () => {
    let authService: AuthService
    let jwtService: JwtService
    let adminService: AdminService
    let blacklistService: BlacklistService

    beforeEach(() => {
        jwtService = {
            sign: vi.fn(),
            verify: vi.fn(),
        } as any

        adminService = {
            validateUser: vi.fn(),
        } as any

        blacklistService = {
            storeRefreshToken: vi.fn(),
            isRefreshTokenValid: vi.fn(),
            isUserBlacklisted: vi.fn(),
            addTokenToBlacklist: vi.fn(),
            isTokenBlacklisted: vi.fn(),
            clearUserRefreshTokens: vi.fn(),
            removeRefreshToken: vi.fn(),
        } as any

        authService = new AuthService(jwtService, adminService, blacklistService)
    })

    describe('validateUser', () => {
        it('应该验证用户并返回用户信息（不含密码）', async () => {
            const mockUser = { id: 1, username: 'admin', password: 'hashed' }
            vi.spyOn(adminService, 'validateUser').mockResolvedValue(mockUser)

            const result = await authService.validateUser('admin', 'password')

            expect(result).toEqual({ id: 1, username: 'admin' })
            expect(result).not.toHaveProperty('password')
        })

        it('应该在用户不存在时返回 null', async () => {
            vi.spyOn(adminService, 'validateUser').mockResolvedValue(null)

            const result = await authService.validateUser('invalid', 'password')

            expect(result).toBeNull()
        })
    })

    describe('login', () => {
        it('应该生成双 token (access + refresh)', async () => {
            const mockUser = { id: 1, username: 'admin' }
            vi.spyOn(jwtService, 'sign').mockReturnValueOnce('mock-access-token').mockReturnValueOnce('mock-refresh-token')
            vi.spyOn(blacklistService, 'storeRefreshToken').mockResolvedValue()

            const result = await authService.login(mockUser)

            expect(result).toHaveProperty('access_token', 'mock-access-token')
            expect(result).toHaveProperty('refresh_token', 'mock-refresh-token')
            expect(result).toHaveProperty('expires_in', 900)
            expect(blacklistService.storeRefreshToken).toHaveBeenCalledWith(1, expect.any(String), 604800)
        })

        it('生成的 token 应该包含 jti', async () => {
            const mockUser = { id: 1, username: 'admin' }
            let accessPayload: any
            let refreshPayload: any

            vi.spyOn(jwtService, 'sign').mockImplementation((payload: any) => {
                if (!accessPayload) {
                    accessPayload = payload
                } else {
                    refreshPayload = payload
                }
                return 'mock-token'
            })
            vi.spyOn(blacklistService, 'storeRefreshToken').mockResolvedValue()

            await authService.login(mockUser)

            expect(accessPayload).toHaveProperty('jti')
            expect(refreshPayload).toHaveProperty('jti')
            expect(accessPayload.jti).not.toBe(refreshPayload.jti)
        })
    })

    describe('refreshToken', () => {
        it('应该使用有效的 refresh token 生成新的 access token', async () => {
            const mockPayload = { username: 'admin', sub: 1, jti: 'refresh-jti' }
            vi.spyOn(jwtService, 'verify').mockReturnValue(mockPayload)
            vi.spyOn(blacklistService, 'isRefreshTokenValid').mockResolvedValue(true)
            vi.spyOn(blacklistService, 'isUserBlacklisted').mockResolvedValue(false)
            vi.spyOn(blacklistService, 'removeRefreshToken').mockResolvedValue()
            vi.spyOn(blacklistService, 'storeRefreshToken').mockResolvedValue()
            vi.spyOn(jwtService, 'sign').mockReturnValueOnce('new-refresh-token').mockReturnValueOnce('new-access-token')

            const result = await authService.refreshToken('valid-refresh-token')

            expect(result).toHaveProperty('access_token', 'new-access-token')
            expect(result).toHaveProperty('refresh_token', 'new-refresh-token')
            expect(result).toHaveProperty('expires_in', 900)
        })

        it('应该拒绝已失效的 refresh token', async () => {
            const mockPayload = { username: 'admin', sub: 1, jti: 'invalid-jti' }
            vi.spyOn(jwtService, 'verify').mockReturnValue(mockPayload)
            vi.spyOn(blacklistService, 'isRefreshTokenValid').mockResolvedValue(false)

            await expect(authService.refreshToken('invalid-token')).rejects.toThrow()
            expect(blacklistService.isRefreshTokenValid).toHaveBeenCalledWith(1, 'invalid-jti')
        })

        it('应该拒绝被全局登出用户的 refresh token', async () => {
            const mockPayload = { username: 'admin', sub: 1, jti: 'valid-jti' }
            vi.spyOn(jwtService, 'verify').mockReturnValue(mockPayload)
            vi.spyOn(blacklistService, 'isRefreshTokenValid').mockResolvedValue(true)
            vi.spyOn(blacklistService, 'isUserBlacklisted').mockResolvedValue(true)

            await expect(authService.refreshToken('valid-token')).rejects.toThrow()
            expect(blacklistService.isUserBlacklisted).toHaveBeenCalledWith(1)
        })

        it('应该拒绝无效或过期的 refresh token', async () => {
            vi.spyOn(jwtService, 'verify').mockImplementation(() => {
                throw new Error('Token expired')
            })

            await expect(authService.refreshToken('expired-token')).rejects.toThrow('Refresh token 无效或已过期')
        })
    })

    describe('logout', () => {
        it('应该将 access token 加入黑名单并清理 refresh tokens', async () => {
            vi.spyOn(blacklistService, 'addTokenToBlacklist').mockResolvedValue()
            vi.spyOn(blacklistService, 'clearUserRefreshTokens').mockResolvedValue()

            const result = await authService.logout(1, 'token-jti')

            expect(blacklistService.addTokenToBlacklist).toHaveBeenCalledWith('token-jti', 1, 900)
            expect(blacklistService.clearUserRefreshTokens).toHaveBeenCalledWith(1)
            expect(result).toEqual({ success: true, message: '登出成功' })
        })
    })

    describe('validateToken', () => {
        it('应该返回 true 当 token 有效时', async () => {
            vi.spyOn(blacklistService, 'isTokenBlacklisted').mockResolvedValue(false)
            vi.spyOn(blacklistService, 'isUserBlacklisted').mockResolvedValue(false)

            const result = await authService.validateToken('valid-jti', 1)

            expect(result).toBe(true)
        })

        it('应该返回 false 当 token 在黑名单中', async () => {
            vi.spyOn(blacklistService, 'isTokenBlacklisted').mockResolvedValue(true)

            const result = await authService.validateToken('blacklisted-jti', 1)

            expect(result).toBe(false)
        })

        it('应该返回 false 当用户被全局登出', async () => {
            vi.spyOn(blacklistService, 'isTokenBlacklisted').mockResolvedValue(false)
            vi.spyOn(blacklistService, 'isUserBlacklisted').mockResolvedValue(true)

            const result = await authService.validateToken('valid-jti', 1)

            expect(result).toBe(false)
        })
    })
})
