import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SourceMapEntity } from '../../entities/sourcemap.entity'
import { SourceMapController } from './sourcemap.controller'
import { SourceMapProcessor } from './sourcemap.processor'
import { SourceMapService } from './sourcemap.service'
import { StackParserService } from './stack-parser.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([SourceMapEntity]),
        BullModule.registerQueue({
            name: 'sourcemap-parser',
        }),
    ],
    controllers: [SourceMapController],
    providers: [SourceMapService, StackParserService, SourceMapProcessor],
    exports: [SourceMapService, StackParserService, BullModule],
})
export class SourceMapModule {}
