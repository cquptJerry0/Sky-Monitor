import { join } from 'node:path'

export default () => ({
    database: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        // database: 'sky-monitor-dsn',
        database: 'postgres',
        password: 'xiaoer',
        entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
        synchronize: true,
    },
})
