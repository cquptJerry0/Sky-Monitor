import { Module } from '@nestjs/common'

import { ApplicationModule } from '../application/application.module'
import { ErrorSimilarityService } from './error-similarity.service'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'

@Module({
    imports: [ApplicationModule],
    controllers: [EventsController],
    providers: [EventsService, ErrorSimilarityService],
    exports: [EventsService, ErrorSimilarityService],
})
export class EventsModule {}
