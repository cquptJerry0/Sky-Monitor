import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('source_maps')
export class SourceMapEntity {
    constructor(partial: Partial<SourceMapEntity>) {
        Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 80 })
    appId: string

    @Column({ type: 'varchar', length: 100 })
    release: string

    @Column({ type: 'varchar', length: 255 })
    fileName: string

    @Column({ type: 'text' })
    content: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    urlPrefix?: string

    @Column({ type: 'timestamp', nullable: true })
    createdAt?: Date

    /**
     * 插入前自动设置中国时间（UTC+8）
     */
    @BeforeInsert()
    setCreatedAt() {
        if (!this.createdAt) {
            // 获取当前 UTC 时间并转换为中国时间（UTC+8）
            const now = new Date()
            const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
            this.createdAt = chinaTime
        }
    }
}
