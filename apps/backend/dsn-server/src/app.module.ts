import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import databaseConfig from './config/database'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module'
import { LoggerMiddleware } from './fundamentals/common/middleware/logger.middleware'
import { MonitoringModule } from './modules/monitoring/monitoring.module'
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
        VersionModule,
        MonitoringModule,
        ClickhouseModule.forRoot({
            url: 'http://localhost:8123',
            username: 'default',
            password: 'skyClickhouse2024',
        }),
    ],
    providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggerMiddleware).exclude({ path: 'hello', method: RequestMethod.POST }).forRoutes('hello')
    }
}
