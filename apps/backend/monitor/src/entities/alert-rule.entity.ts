import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('alert_rules')
export class AlertRule {
    @PrimaryColumn('uuid')
    id: string

    @Column({ name: 'app_id', type: 'varchar', length: 255 })
    app_id: string

    @Column({ name: 'user_id', type: 'int' })
    user_id: number

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ type: 'enum', enum: ['error_rate', 'slow_request', 'session_anomaly'] })
    type: 'error_rate' | 'slow_request' | 'session_anomaly'

    @Column({ type: 'float' })
    threshold: number

    @Column({ type: 'varchar', length: 50 })
    window: string

    @Column({ type: 'boolean', default: true })
    enabled: boolean

    @Column({ name: 'notification_channels', type: 'simple-json', nullable: true })
    notification_channels: string[]

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date
}
