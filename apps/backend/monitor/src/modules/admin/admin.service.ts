import { HttpException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'

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
}
