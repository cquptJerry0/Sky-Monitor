import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { AdminModule } from '../admin/admin.module'
import { EmailModule } from '../email/email.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { BlacklistService } from './blacklist.service'
import { jwtConstants } from './constants'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: jwtConstants.accessTokenExpiry },
        }),
        AdminModule,
        EmailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, BlacklistService, LocalStrategy, JwtStrategy],
    exports: [AuthService, BlacklistService],
})
export class AuthModule {}
