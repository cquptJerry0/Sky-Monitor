import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { AdminEntity } from './admin.entity'
import { ApplicationEntity } from './application.entity'
import { DashboardWidgetEntity } from './dashboard-widget.entity'

/**
 * Dashboard 实体
 * 用于存储用户自定义的监控面板配置
 */
@Entity('dashboard')
export class DashboardEntity {
    constructor(partial: Partial<DashboardEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn('uuid')
    id: string

    /**
     * Dashboard 名称
     */
    @Column({ type: 'varchar', length: 255 })
    name: string

    /**
     * Dashboard 描述
     */
    @Column({ type: 'text', nullable: true })
    description: string

    /**
     * 是否为默认 Dashboard
     */
    @Column({ type: 'boolean', default: false })
    isDefault: boolean

    /**
     * 创建时间
     */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date

    /**
     * 更新时间
     */
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date

    /**
     * 用户 ID (外键)
     */
    @Column({ type: 'integer' })
    userId: number

    /**
     * 应用 ID (外键,可选)
     * NULL 表示全局 Dashboard,不关联特定应用
     */
    @Column({ type: 'varchar', length: 80, nullable: true })
    appId: string

    /**
     * 关联用户
     */
    @ManyToOne(() => AdminEntity)
    @JoinColumn({ name: 'userId' })
    user: AdminEntity

    /**
     * 关联应用 (可选)
     */
    @ManyToOne(() => ApplicationEntity, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'appId', referencedColumnName: 'appId' })
    application: ApplicationEntity

    /**
     * 关联的 Widgets
     */
    @OneToMany(() => DashboardWidgetEntity, widget => widget.dashboard)
    widgets: DashboardWidgetEntity[]
}
