import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name)

    constructor(private readonly mailerService: MailerService) {}

    async sendResetPasswordEmail(email: string, resetUrl: string, expiresIn: number = 1): Promise<void> {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '重置密码 - Sky Monitor',
                template: 'reset-password',
                context: {
                    resetUrl,
                    expiresIn,
                },
            })
            this.logger.log(`重置密码邮件已发送到: ${email}`)
        } catch (error) {
            this.logger.error(`发送重置密码邮件失败: ${error.message}`, error.stack)
            throw new Error('发送邮件失败')
        }
    }
}
