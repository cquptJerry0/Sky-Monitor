import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

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
}
