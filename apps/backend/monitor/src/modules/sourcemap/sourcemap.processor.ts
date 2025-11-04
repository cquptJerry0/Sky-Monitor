import { ClickHouseClient } from '@clickhouse/client'
import { Process, Processor } from '@nestjs/bull'
import { Inject, Logger } from '@nestjs/common'
import { Job } from 'bull'

import { StackParserService } from './stack-parser.service'

@Processor('sourcemap-parser')
export class SourceMapProcessor {
    private readonly logger = new Logger(SourceMapProcessor.name)

    constructor(
        private readonly stackParser: StackParserService,
        @Inject('CLICKHOUSE_CLIENT') private clickhouseClient: ClickHouseClient
    ) {}

    @Process('parse-stack')
    async handleParseStack(job: Job) {
        const { eventId, stack, release, appId } = job.data

        try {
            this.logger.log(`Parsing stack for event ${eventId}, release ${release}`)

            const parsedStack = await this.stackParser.parseStack(stack, release, appId)

            await this.updateEventStack(eventId, parsedStack, stack)

            this.logger.log(`Stack parsed successfully for event ${eventId}`)
        } catch (error) {
            this.logger.error(`Failed to parse stack for event ${eventId}: ${error.message}`, error.stack)
            throw error
        }
    }

    private async updateEventStack(eventId: string, parsedStack: string, originalStack: string) {
        try {
            const query = `
                SELECT event_data
                FROM monitor_events
                WHERE id = '${eventId}'
                LIMIT 1
            `

            const result = await this.clickhouseClient.query({ query })
            const data = (await result.json()) as { data: Array<{ event_data: string }> }

            if (data.data && data.data.length > 0) {
                const eventData = JSON.parse(data.data[0].event_data)
                eventData.parsedStack = parsedStack
                eventData.originalStack = originalStack

                const updateQuery = `
                    ALTER TABLE monitor_events
                    UPDATE event_data = '${JSON.stringify(eventData).replace(/'/g, "\\'")}'
                    WHERE id = '${eventId}'
                `

                await this.clickhouseClient.query({ query: updateQuery })
            }
        } catch (error) {
            this.logger.error(`Failed to update event stack: ${error.message}`, error.stack)
            throw error
        }
    }
}
