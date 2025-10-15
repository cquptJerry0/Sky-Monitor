import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { jwtConstants } from './constants'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(/* private readonly salesmanService: SalesmanService */) {
        super({
            jwtFromRequest: ExtractJwt.fromHeader('token'),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        })
    }

    async validate(/* payload: any */) {
        // const user = await this.salesmanService.find(payload.username)
        // return user
    }
}
