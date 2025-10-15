import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async validateUser(/* username: string, pass: string */): Promise<any> {
        // const user = await this.salesmanService.findAuth(username)
        // if (user && user.password === pass) {
        //     const { password, ...result } = user
        //     return result
        // }
        return null
    }

    async login(user: any): Promise<any> {
        const payload = { username: user.username, sub: user.userId }
        return {
            access_token: this.jwtService.sign(payload),
        }
    }

    async logout(/* user: any */): Promise<any> {
        // 将 jwt 置为失效

        return true
    }
}
