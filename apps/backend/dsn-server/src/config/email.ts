import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter'
import { join } from 'path'

export default () => ({
    email: {
        transport: 'smtps://xxxxx@qq.com:tsjjzmqcmhmoheje@smtp.qq.com',
        defaults: {
            from: '"nest-modules" <modules@nestjs.com>',
        },
        template: {
            dir: join(__dirname, '../templates/email'),
            adapter: new PugAdapter(),
            options: {
                strict: true,
            },
        },
    },
})
