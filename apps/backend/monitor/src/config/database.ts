import { join } from 'node:path'

export default () => {
    const isProd = process.env.NODE_ENV === 'production'
    // 如果是生产环境则用loaclhost
    return {
        database: {
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            database: 'postgres',
            password: 'xiaoer',
            entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
            synchronize: true,
        },
    }
}
