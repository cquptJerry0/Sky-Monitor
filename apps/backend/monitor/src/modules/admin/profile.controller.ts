import { Body, Controller, Post, Put, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { nanoid } from 'nanoid'

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

    @Post('avatar/upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/avatars',
                filename: (req, file, callback) => {
                    const uniqueName = `${nanoid()}-${Date.now()}${extname(file.originalname)}`
                    callback(null, uniqueName)
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, callback) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    return callback(new Error('只支持图片格式(jpg, jpeg, png, gif, webp)'), false)
                }
                callback(null, true)
            },
        })
    )
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
        if (!file) {
            return { success: false, message: '没有上传文件' }
        }

        // 生成访问URL (假设静态文件服务在 /uploads 路径)
        const avatarUrl = `/uploads/avatars/${file.filename}`

        // 更新用户头像
        const user = await this.adminService.updateAvatar(req.user.id, avatarUrl)

        return { data: { user, url: avatarUrl }, success: true }
    }
}
