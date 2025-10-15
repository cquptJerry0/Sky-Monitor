import { MailerService } from '@nest-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EmailService {
    constructor(private readonly mailerService: MailerService) {}

    sendEmail() {
        this.mailerService.sendMail({
            to: 'xxx@163.com',
            from: 'ccc@qq.com',
            // subject: 'Testing Nest MailerModule ✔',
            subject: 'very nice ✔',
            // html: '<b>Welcome Frost!</b>',
            template: 'welcome',
        })
    }
}
