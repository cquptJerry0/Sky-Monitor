import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { ReplaysController } from './replays.controller'
import { ReplaysService } from './replays.service'

@Module({
    imports: [TypeOrmModule.forFeature([ApplicationEntity])],
    controllers: [ReplaysController],
    providers: [ReplaysService],
    exports: [ReplaysService],
})
export class ReplaysModule {}
