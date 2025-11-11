import { Body, Controller, Get, Post, Request, Req, Res, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Request as ExpressRequest, Response } from 'express'

import { AuthService } from './auth.service'
import { cookieConstants } from './constants'

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * 登录
     *
     * 安全说明：
     * - Access Token 在响应体中返回（短期，15分钟）
     * - Refresh Token 通过 HttpOnly Cookie 设置（长期，7天）
     *
     * @param req Express 请求对象
     * @param res Express 响应对象
     * @returns 登录成功返回 access_token
     */
    @UseGuards(AuthGuard('local'))
    @Post('/auth/login')
    async login(@Req() req: ExpressRequest & { user: any }, @Res() res: Response) {
        const result = await this.authService.login(req.user)

        // 设置 refresh token 到 HttpOnly Cookie
        res.cookie('refreshToken', result.refresh_token, {
            httpOnly: cookieConstants.httpOnly,
            secure: cookieConstants.secure,
            sameSite: cookieConstants.sameSite,
            maxAge: cookieConstants.maxAge,
            path: '/api/auth', // 限制 Cookie 的使用路径到认证相关接口
        })

        // 只返回 access token 和过期时间
        res.json({
            success: true,
            data: {
                access_token: result.access_token,
                expires_in: result.expires_in,
                // 不再返回 refresh_token，它在 Cookie 中
            },
        })
    }

    /**
     * 刷新 access token
     *
     * 安全说明：
     * - Refresh Token 从 HttpOnly Cookie 中读取
     * - 返回新的 Access Token
     * - 不更新 Refresh Token（除非需要轮换）
     *
     * @param req Express 请求对象
     * @param res Express 响应对象
     * @returns 新的 access_token
     */
    @Post('/auth/refresh')
    async refreshToken(@Req() req: ExpressRequest, @Res() res: Response) {
        // 从 Cookie 中读取 refresh token
        const refreshToken = req.cookies?.refreshToken

        if (!refreshToken) {
            res.status(401).json({
                success: false,
                message: 'Refresh token not found',
            })
            return
        }

        try {
            const result = await this.authService.refreshToken(refreshToken)

            // 返回新的 access token
            res.json({
                success: true,
                data: result,
            })
        } catch (error) {
            // 如果 refresh token 无效或过期，清除 Cookie
            res.clearCookie('refreshToken', { path: '/api/auth' })
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid refresh token',
            })
        }
    }

    /**
     * 登出当前设备
     *
     * 安全说明：
     * - 清除 HttpOnly Cookie 中的 Refresh Token
     * - 将 Access Token 加入黑名单
     *
     * @param req Express 请求对象
     * @param res Express 响应对象
     * @returns 登出成功消息
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('/auth/logout')
    async logout(@Request() req, @Res() res: Response) {
        const result = await this.authService.logout(req.user.id, req.user.jti)

        // 清除 refresh token Cookie
        res.clearCookie('refreshToken', { path: '/api/auth' })

        res.json(result)
    }

    /**
     * 登出所有设备
     * @param req
     * @returns
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('/auth/logout-all')
    async logoutAll(@Request() req) {
        return await this.authService.logoutAll(req.user.id)
    }

    /**
     * 获取用户信息
     * @param req
     * @returns
     */

    // 测试登录后才可访问的接口，在需要的地方使用守卫，可保证必须携带token才能访问
    @UseGuards(AuthGuard('jwt'))
    @Get('currentUser')
    currentUser(@Request() req) {
        return { data: req.user }
    }

    // 测试登录后才可访问的接口，在需要的地方使用守卫，可保证必须携带token才能访问
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req) {
        return req.user
    }
}
