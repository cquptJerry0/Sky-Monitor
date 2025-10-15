import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { AdminService } from '../admin/admin.service'
import { jwtConstants } from './constants'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly adminService: AdminService) {
        super({
            jwtFromRequest: ExtractJwt.fromHeader('token'),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        })
    }

    async validate(payload: any) {
        const user = await this.adminService.validateUser(payload.username, payload.password)
        return user
    }
}
