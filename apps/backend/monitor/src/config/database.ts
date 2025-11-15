import { join } from 'node:path'

export default () => {
    const isProd = process.env.NODE_ENV === 'production'
    // 如果是生产环境则用loaclhost
    return {
        database: {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            database: process.env.DB_DATABASE || 'postgres',
            password: process.env.DB_PASSWORD,
            entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
            synchronize: true,
            timezone: 'Asia/Shanghai',
        },
    }
}
