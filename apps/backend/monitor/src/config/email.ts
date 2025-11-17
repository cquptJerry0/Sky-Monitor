import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'

export default () => ({
    email: {
        transport: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'your-email@gmail.com',
                pass: process.env.SMTP_PASS || 'your-app-password',
            },
        },
        defaults: {
            from: `"Sky Monitor" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@skymonitor.com'}>`,
        },
        template: {
            dir: join(__dirname, '../fundamentals/templates/email'),
            adapter: new HandlebarsAdapter(),
            options: {
                strict: true,
            },
        },
    },
})
