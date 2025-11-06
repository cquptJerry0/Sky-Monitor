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
     * 系统完整健康检查 - 包含应用状态和所有依赖服务状态
     */
    @Get()
    @ApiOperation({ summary: '系统完整健康检查' })
    async health() {
        const appHealth = await this.healthService.getSystemHealth()
        const dependencies = await this.healthService.getAllDependenciesHealth()
        const tableStats = await this.clickhouseInitService.getTableStats()

        // 计算整体健康状态
        const allHealthy = dependencies.postgresql.connected && dependencies.redis.connected && dependencies.clickhouse.connected

        return {
            success: allHealthy,
            status: allHealthy ? 'healthy' : 'degraded',
            application: appHealth,
            dependencies: {
                postgresql: dependencies.postgresql,
                redis: dependencies.redis,
                clickhouse: {
                    ...dependencies.clickhouse,
                    tableStats,
                },
            },
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * 快速健康检查 - 仅检查应用状态
     */
    @Get('ping')
    @ApiOperation({ summary: '快速健康检查' })
    async ping() {
        return {
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString(),
        }
    }

    /**
     * 详细依赖检查 - 检查所有依赖服务
     */
    @Get('dependencies')
    @ApiOperation({ summary: '检查所有依赖服务状态' })
    async dependencies() {
        const dependencies = await this.healthService.getAllDependenciesHealth()

        return {
            success: true,
            dependencies,
            timestamp: new Date().toISOString(),
        }
    }
}
