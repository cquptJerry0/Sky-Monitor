import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { AuthService } from './auth.service'

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /**
     * 登录
     * @param req
     * @returns
     */
    @UseGuards(AuthGuard('local'))
    @Post('/auth/login')
    async login(@Request() req) {
        return { data: await this.authService.login(req.user), success: true }
    }

    /**
     * 刷新 access token
     * @param body
     * @returns
     */
    @Post('/auth/refresh')
    async refreshToken(@Body('refresh_token') refreshToken: string) {
        return { data: await this.authService.refreshToken(refreshToken), success: true }
    }

    /**
     * 登出当前设备
     * @param req
     * @returns
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('/auth/logout')
    async logout(@Request() req) {
        return await this.authService.logout(req.user.id, req.user.jti)
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
