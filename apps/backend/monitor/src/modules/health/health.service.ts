import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class HealthService {
    private readonly logger = new Logger(HealthService.name)

    /**
     * 获取系统健康状态
     */
    async getSystemHealth() {
        try {
            const uptime = process.uptime()
            const memoryUsage = process.memoryUsage()

            return {
                status: 'ok',
                uptime: Math.floor(uptime),
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                },
                timestamp: new Date().toISOString(),
            }
        } catch (error) {
            this.logger.error(`Failed to get system health: ${error.message}`)
            return {
                status: 'error',
                error: error.message,
            }
        }
    }
}
