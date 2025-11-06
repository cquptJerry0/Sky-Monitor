import { Module } from '@nestjs/common'

import { ApplicationModule } from '../application/application.module'
import { EventsController } from './events.controller'
import { EventsStreamController } from './events-stream.controller'
import { EventsService } from './events.service'

@Module({
    imports: [ApplicationModule],
    controllers: [EventsController, EventsStreamController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
