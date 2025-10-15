import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'admin' })
export class AdminEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column()
    password: string

    @Column({ nullable: true })
    email: string

    @Column({ nullable: true })
    phone: string

    @Column({ nullable: true })
    role: string
}
