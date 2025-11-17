import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'admin' })
export class AdminEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar')
    username: string

    @Column('varchar')
    password: string

    @Column({ type: 'varchar', nullable: true })
    email: string

    @Column({ type: 'varchar', nullable: true })
    phone: string

    @Column({ type: 'varchar', nullable: true })
    role: string

    @Column({ type: 'varchar', nullable: true, length: 500 })
    avatar: string

    @Column({ type: 'varchar', nullable: true, length: 255 })
    reset_token: string

    @Column({ type: 'timestamp', nullable: true })
    reset_token_expires: Date

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date

    @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date
}
