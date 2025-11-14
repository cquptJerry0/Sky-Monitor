import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { AdminEntity } from './admin.entity'
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
     * 关联用户
     */
    @ManyToOne(() => AdminEntity)
    @JoinColumn({ name: 'userId' })
    user: AdminEntity

    /**
     * 关联的 Widgets
     */
    @OneToMany(() => DashboardWidgetEntity, widget => widget.dashboard)
    widgets: DashboardWidgetEntity[]
}
