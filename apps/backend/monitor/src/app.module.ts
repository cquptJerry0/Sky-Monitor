import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import databaseConfig from './config/database'
import { CacheModule } from './fundamentals/cache/cache.module'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module'
import { RedisModule } from './fundamentals/redis'
import { AlertsModule } from './modules/alerts/alerts.module'
import { ApplicationModule } from './modules/application/application.module'
import { AuthModule } from './modules/auth/auth.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { ErrorAnalyticsModule } from './modules/error-analytics/error-analytics.module'
import { EventsModule } from './modules/events/events.module'
import { HealthModule } from './modules/health/health.module'
import { SourceMapModule } from './modules/sourcemap/sourcemap.module'
import { VersionModule } from './modules/version/version.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            load: [databaseConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                return config.get('database')
            },
            inject: [ConfigService],
        }),
        BullModule.forRoot({
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD,
            },
        }),
        ClickhouseModule.forRoot({
            url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
            username: process.env.CLICKHOUSE_USERNAME || 'default',
            password: process.env.CLICKHOUSE_PASSWORD,
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
        DashboardModule,
    ],
    providers: [],
})
export class AppModule {}
