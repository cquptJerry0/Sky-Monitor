import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { ReplaysService } from './replays.service'

@ApiTags('Replays')
@Controller('replays')
export class ReplaysController {
    constructor(
        private readonly replaysService: ReplaysService,
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>
    ) {}

    /**
     * 根据 replayId 获取 Replay 数据
     * GET /api/replays/:replayId
     */
    @Get(':replayId')
    @ApiOperation({ summary: '根据 replayId 获取 Replay 数据' })
    @ApiParam({ name: 'replayId', description: 'Replay ID' })
    @ApiQuery({ name: 'appId', description: '应用数据库 ID', required: true })
    async getReplayById(@Param('replayId') replayId: string, @Query('appId') appId: string) {
        if (!appId) {
            throw new NotFoundException('appId is required')
        }

        const actualAppId = await this.resolveAppId(appId)
        const replay = await this.replaysService.getReplayById(replayId, actualAppId)

        if (!replay) {
            throw new NotFoundException(`Replay not found: ${replayId}`)
        }

        return {
            success: true,
            data: replay,
        }
    }

    /**
     * 根据 replayId 获取关联的所有错误事件
     * GET /api/replays/:replayId/errors
     */
    @Get(':replayId/errors')
    @ApiOperation({ summary: '根据 replayId 获取关联的所有错误事件' })
    @ApiParam({ name: 'replayId', description: 'Replay ID' })
    @ApiQuery({ name: 'appId', description: '应用数据库 ID', required: true })
    async getRelatedErrors(@Param('replayId') replayId: string, @Query('appId') appId: string) {
        if (!appId) {
            throw new NotFoundException('appId is required')
        }

        const actualAppId = await this.resolveAppId(appId)
        const errors = await this.replaysService.getRelatedErrors(replayId, actualAppId)

        return {
            success: true,
            data: errors,
        }
    }

    /**
     * 将数据库 ID 或 appId 字符串转换为实际的 appId
     * 如果传入的是数字 ID,则查询数据库获取 appId
     * 如果传入的已经是 appId 字符串,则直接返回
     */
    private async resolveAppId(appIdOrDbId: string): Promise<string> {
        const dbId = parseInt(appIdOrDbId)
        if (!isNaN(dbId)) {
            const app = await this.applicationRepository.findOne({ where: { id: dbId } })
            if (!app) {
                throw new NotFoundException(`Application not found with id: ${dbId}`)
            }
            return app.appId
        }
        return appIdOrDbId
    }
}
