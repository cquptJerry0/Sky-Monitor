import { Module } from '@nestjs/common'

import { ApplicationModule } from '../application/application.module'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'

@Module({
    imports: [ApplicationModule],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
