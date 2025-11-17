import { MailerModule } from '@nestjs-modules/mailer'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'

import emailConfig from '../../config/email'
import { EmailService } from './email.service'

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [emailConfig],
        }),
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => config.get('email'),
            inject: [ConfigService],
        }),
    ],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
