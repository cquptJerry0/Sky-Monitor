import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

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

    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date
}
