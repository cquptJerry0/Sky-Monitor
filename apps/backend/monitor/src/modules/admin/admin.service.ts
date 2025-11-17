import { HttpException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

import { AdminEntity } from '../../entities/admin.entity'

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(AdminEntity)
        private readonly adminRepository: Repository<AdminEntity>
    ) {}

    async validateUser(username: string, pass: string): Promise<any> {
        // 第一步：根据用户名查询用户
        const admin = await this.adminRepository.findOne({
            where: { username },
        })

        // 第二步：如果用户不存在，返回 null
        if (!admin) {
            return null
        }

        // 第三步：使用 bcrypt 比较密码
        const isPasswordValid = await bcrypt.compare(pass, admin.password)
        if (!isPasswordValid) {
            return null
        }

        // 第四步：返回用户信息
        return admin
    }

    async register(body) {
        const adminIsExist = await this.adminRepository.findOne({
            where: { username: body.username },
        })
        if (adminIsExist) {
            throw new HttpException({ message: '用户已存在', error: 'user is existed' }, 400)
        }

        // 使用 bcrypt 加密密码
        const hashedPassword = await bcrypt.hash(body.password, 10)
        const admin = await this.adminRepository.create({
            ...body,
            password: hashedPassword,
        })
        await this.adminRepository.save(admin)
        return admin
    }

    async updateEmail(userId: number, email: string) {
        // 检查邮箱是否已被其他用户使用
        const existingUser = await this.adminRepository.findOne({
            where: { email },
        })
        if (existingUser && existingUser.id !== userId) {
            throw new HttpException({ message: '邮箱已被使用', error: 'email already in use' }, 400)
        }

        const admin = await this.adminRepository.findOne({
            where: { id: userId },
        })
        if (!admin) {
            throw new HttpException({ message: '用户不存在', error: 'user not found' }, 404)
        }

        admin.email = email
        await this.adminRepository.save(admin)

        // 不返回密码
        const { password, ...result } = admin
        return result
    }

    async updatePassword(userId: number, currentPassword: string, newPassword: string) {
        const admin = await this.adminRepository.findOne({
            where: { id: userId },
        })
        if (!admin) {
            throw new HttpException({ message: '用户不存在', error: 'user not found' }, 404)
        }

        // 验证当前密码
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password)
        if (!isPasswordValid) {
            throw new HttpException({ message: '当前密码错误', error: 'invalid current password' }, 400)
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        admin.password = hashedPassword
        await this.adminRepository.save(admin)

        // 不返回密码
        const { password, ...result } = admin
        return result
    }

    async updateAvatar(userId: number, avatar: string) {
        const admin = await this.adminRepository.findOne({
            where: { id: userId },
        })
        if (!admin) {
            throw new HttpException({ message: '用户不存在', error: 'user not found' }, 404)
        }

        admin.avatar = avatar
        await this.adminRepository.save(admin)

        // 不返回密码
        const { password, ...result } = admin
        return result
    }

    async generateResetToken(email: string): Promise<{ token: string; user: AdminEntity }> {
        const admin = await this.adminRepository.findOne({
            where: { email },
        })
        if (!admin) {
            throw new HttpException({ message: '该邮箱未注册', error: 'email not found' }, 404)
        }

        // 生成随机token
        const token = randomBytes(32).toString('hex')

        // 设置token过期时间(1小时后)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 1)

        admin.reset_token = token
        admin.reset_token_expires = expiresAt
        await this.adminRepository.save(admin)

        return { token, user: admin }
    }

    async resetPassword(token: string, newPassword: string): Promise<AdminEntity> {
        const admin = await this.adminRepository.findOne({
            where: { reset_token: token },
        })

        if (!admin) {
            throw new HttpException({ message: '无效的重置令牌', error: 'invalid token' }, 400)
        }

        // 检查token是否过期
        if (admin.reset_token_expires < new Date()) {
            throw new HttpException({ message: '重置令牌已过期', error: 'token expired' }, 400)
        }

        // 更新密码
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        admin.password = hashedPassword

        // 清除reset token
        admin.reset_token = null
        admin.reset_token_expires = null

        await this.adminRepository.save(admin)

        // 不返回密码
        const { password, ...result } = admin
        return result as AdminEntity
    }
}
