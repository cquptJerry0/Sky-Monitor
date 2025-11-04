import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { SourceMapEntity } from '../../entities/sourcemap.entity'

@Injectable()
export class SourceMapService {
    private readonly logger = new Logger(SourceMapService.name)

    constructor(
        @InjectRepository(SourceMapEntity)
        private readonly repository: Repository<SourceMapEntity>
    ) {}

    async save(params: { appId: string; release: string; fileName: string; content: string; urlPrefix?: string }) {
        try {
            const entity = this.repository.create(params)
            const saved = await this.repository.save(entity)
            this.logger.log(`Source map saved: ${params.fileName} for release ${params.release}`)
            return saved
        } catch (error) {
            this.logger.error(`Failed to save source map: ${error.message}`, error.stack)
            throw error
        }
    }

    async getByReleaseAndFile(release: string, fileName: string): Promise<SourceMapEntity | null> {
        try {
            return await this.repository.findOne({
                where: { release, fileName },
            })
        } catch (error) {
            this.logger.error(`Failed to get source map: ${error.message}`, error.stack)
            return null
        }
    }

    async getByRelease(release: string): Promise<SourceMapEntity[]> {
        try {
            return await this.repository.find({
                where: { release },
            })
        } catch (error) {
            this.logger.error(`Failed to get source maps for release: ${error.message}`, error.stack)
            return []
        }
    }
}
