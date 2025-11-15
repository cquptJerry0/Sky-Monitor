import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * Application Entity
 * 这个实体定义对应 PostgreSQL 的 application 表
 * DSN Server 和 Monitor Server 共享同一个 PostgreSQL 数据库
 * 因此 DSN Server 也需要定义这个实体来查询应用信息
 */
@Entity('application')
export class ApplicationEntity {
    /**
     * 主键
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * 应用 ID (appId)
     */
    @Column({ type: 'varchar', length: 80, unique: true })
    appId: string

    /**
     * 应用类型：vanilla, react, vue
     */
    @Column({ type: 'enum', enum: ['vanilla', 'react', 'vue'] })
    type: 'vanilla' | 'react' | 'vue'

    /**
     * 应用名称
     */
    @Column({ type: 'varchar', length: 255 })
    name: string

    /**
     * 应用描述
     */
    @Column({ type: 'text', nullable: true })
    description: string

    /**
     * 创建时间
     */
    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    /**
     * 更新时间
     */
    @Column({ nullable: true })
    updatedAt?: Date

    /**
     * 用户ID 外键
     */
    @Column({ type: 'integer', nullable: false })
    userId: number
}
