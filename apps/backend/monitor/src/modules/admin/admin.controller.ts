import { Body, Controller, Post } from '@nestjs/common'

import { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Post('register')
    async add(@Body() body) {
        const newUser = await this.adminService.register(body)
        return { data: newUser, success: true }
    }
}
