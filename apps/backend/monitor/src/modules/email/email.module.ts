import { Module } from '@nestjs/common'

import { EmailService } from './email.service'

@Module({
    imports: [],
    providers: [EmailService],
})
export class EmailModule {}
