import { ClickHouseClient } from '@clickhouse/client'
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'
import { MonitoringEventDto } from './monitoring.dto'

@Injectable()
export class MonitoringService {
    private readonly logger = new Logger(MonitoringService.name)

    constructor(
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient,
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>
    ) {}

    private formatTimestamp(date: Date): string {
        const year = date.getUTCFullYear()
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        const hours = String(date.getUTCHours()).padStart(2, '0')
        const minutes = String(date.getUTCMinutes()).padStart(2, '0')
        const seconds = String(date.getUTCSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    async receiveEvent(appId: string, event: MonitoringEventDto, userAgent?: string) {
        try {
            const eventData = {
                app_id: appId,
                event_type: event.type,
                event_name: event.name || '',
                event_data: JSON.stringify({
                    value: event.value,
                    message: event.message,
                    event: event.event,
                    ...event,
                }),
                path: event.path || '',
                user_agent: userAgent || event.userAgent || '',
                timestamp: this.formatTimestamp(new Date()),
            }

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: [eventData],
                format: 'JSONEachRow',
            })

            this.logger.log(`Event received for app: ${appId}, type: ${event.type}`)

            return { success: true, message: 'Event recorded' }
        } catch (error) {
            this.logger.error(`Failed to record event: ${error.message}`, error.stack)
            throw error
        }
    }

    async receiveBatchEvents(appId: string, events: MonitoringEventDto[], userAgent?: string) {
        try {
            const now = new Date()
            const eventDataList = events.map(event => ({
                app_id: appId,
                event_type: event.type,
                event_name: event.name || '',
                event_data: JSON.stringify({
                    value: event.value,
                    message: event.message,
                    event: event.event,
                    ...event,
                }),
                path: event.path || '',
                user_agent: userAgent || event.userAgent || '',
                timestamp: this.formatTimestamp(now),
            }))

            await this.clickhouseClient.insert({
                table: 'monitor_events',
                values: eventDataList,
                format: 'JSONEachRow',
            })

            this.logger.log(`Batch events received for app: ${appId}, count: ${events.length}`)

            return { success: true, message: `${events.length} events recorded` }
        } catch (error) {
            this.logger.error(`Failed to record batch events: ${error.message}`, error.stack)
            throw error
        }
    }

    async getApplicationsByUserId(userId: number) {
        try {
            const [applications, count] = await this.applicationRepository.findAndCount({
                where: { userId },
            })
            this.logger.log(`Fetched ${applications.length} applications for user: ${userId}`)
            return { success: true, data: applications, count }
        } catch (error) {
            this.logger.error(`Failed to get applications for user ${userId}: ${error.message}`, error.stack)
            return { success: false, data: [], count: 0, error: error.message }
        }
    }

    async validateAppId(appId: string): Promise<boolean> {
        try {
            const app = await this.applicationRepository.findOne({
                where: { appId },
            })

            if (!app) {
                throw new BadRequestException(`Invalid appId: ${appId}. Application not found in database.`)
            }

            this.logger.log(`AppId validated successfully: ${appId}`)
            return true
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error
            }
            this.logger.error(`Failed to validate appId ${appId}: ${error.message}`, error.stack)
            throw new BadRequestException(`Failed to validate appId: ${appId}`)
        }
    }
}
