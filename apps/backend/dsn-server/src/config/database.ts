import { join } from 'node:path'

export default () => ({
    database: {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        // database: 'sky-monitor-dsn',
        database: process.env.DB_DATABASE || 'postgres',
        password: process.env.DB_PASSWORD,
        entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
        synchronize: true,
    },
})
