import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { ClickhouseInitService } from '../../fundamentals/clickhouse/clickhouse-init.service'
import { HealthService } from './health.service'

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
        private readonly clickhouseInitService: ClickhouseInitService
    ) {}

    /**
     * 系统完整健康检查 - 包含应用状态和数据库状态
     */
    @Get()
    @ApiOperation({ summary: '系统完整健康检查' })
    async health() {
        const appHealth = await this.healthService.getSystemHealth()
        const clickhouseHealthy = await this.clickhouseInitService.healthCheck()
        const tableStats = await this.clickhouseInitService.getTableStats()

        return {
            success: true,
            application: appHealth,
            database: {
                clickhouse: {
                    connected: clickhouseHealthy,
                    tableStats,
                },
            },
            timestamp: new Date().toISOString(),
        }
    }
}
