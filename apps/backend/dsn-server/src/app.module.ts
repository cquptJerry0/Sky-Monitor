import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import databaseConfig from './config/database'
import { ClickhouseModule } from './fundamentals/clickhouse/clickhouse.module'
import { LoggerMiddleware } from './fundamentals/common/middleware/logger.middleware'
import { AuthModule } from './modules/auth/auth.module'
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
        AuthModule,
        VersionModule,
        ClickhouseModule.forRoot({
            url: 'http://localhost:8123', // ClickHouse 服务地址
            username: 'default', // ClickHouse 用户名
            password: 'skyClickhouse2024', // ClickHouse 密码
        }),
    ],
    providers: [],
})
export class AppModule {
    configure(consumer: MiddlewareConsumer) {
        // 为 hello 路由添加中间件
        consumer.apply(LoggerMiddleware).exclude({ path: 'hello', method: RequestMethod.POST }).forRoutes('hello')
    }
}
