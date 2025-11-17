import { Body, Controller, Put, Request, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { AdminService } from './admin.service'

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
    constructor(private readonly adminService: AdminService) {}

    @Put('email')
    async updateEmail(@Body() body: { email: string }, @Request() req) {
        const user = await this.adminService.updateEmail(req.user.id, body.email)
        return { data: user, success: true }
    }

    @Put('password')
    async updatePassword(@Body() body: { currentPassword: string; newPassword: string }, @Request() req) {
        const user = await this.adminService.updatePassword(req.user.id, body.currentPassword, body.newPassword)
        return { data: user, success: true }
    }

    @Put('avatar')
    async updateAvatar(@Body() body: { avatar: string }, @Request() req) {
        const user = await this.adminService.updateAvatar(req.user.id, body.avatar)
        return { data: user, success: true }
    }
}
