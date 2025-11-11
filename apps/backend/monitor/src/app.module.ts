import { BullModule } from '@nestjs/bull'
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import databaseConfig from './config/database'
import { CacheModule } from './fundamentals/cache/cache.module'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module'
import { LoggerMiddleware } from './fundamentals/common/middleware/logger.middleware'
import { RedisModule } from './fundamentals/redis'
import { AlertsModule } from './modules/alerts/alerts.module'
import { ApplicationModule } from './modules/application/application.module'
import { AuthModule } from './modules/auth/auth.module'
import { ErrorAnalyticsModule } from './modules/error-analytics/error-analytics.module'
import { EventsModule } from './modules/events/events.module'
import { HealthModule } from './modules/health/health.module'
import { SourceMapModule } from './modules/sourcemap/sourcemap.module'
import { VersionModule } from './modules/version/version.module'

@Module({
    imports: [
        ConfigModule.forRoot({ load: [databaseConfig] }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return config.get('database')
            },
            inject: [ConfigService],
        }),
        BullModule.forRoot({
            redis: {
                host: 'localhost',
                port: 6379,
                password: 'skyRedis2024',
            },
        }),
        ClickhouseModule.forRoot({
            url: 'http://localhost:8123',
            username: 'default',
            password: 'skyClickhouse2024',
        }),
        RedisModule,
        CacheModule,
        AuthModule,
        VersionModule,
        EventsModule,
        ErrorAnalyticsModule,
        HealthModule,
        ApplicationModule,
        SourceMapModule,
        AlertsModule,
    ],
    providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        // 为 hello 路由添加中间件
        consumer.apply(LoggerMiddleware).exclude({ path: 'hello', method: RequestMethod.POST }).forRoutes('hello')
    }
}
