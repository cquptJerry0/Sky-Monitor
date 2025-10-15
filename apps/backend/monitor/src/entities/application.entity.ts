import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'

import { AdminEntity } from './admin.entity'

@Entity('application')
export class ApplicationEntity {
    /**
     * 用于自实例化实体初始化
     * @param partial
     */
    constructor(partial: Partial<ApplicationEntity>) {
        Object.assign(this, partial)
    }

    /**
     * 主键
     */
    @PrimaryGeneratedColumn()
    id: number

    /**
     * 项目ID
     */
    @Column({ type: 'varchar', length: 80 })
    appId: string

    /**
     * 项目类型
     */
    @Column({ type: 'enum', enum: ['vanilla', 'react', 'vue'] })
    type: 'vanilla' | 'react' | 'vue'

    /**
     * 项目名称
     */
    @Column({ type: 'varchar', length: 255 })
    name: string

    /**
     * 项目描述
     */
    @Column({ type: 'text', nullable: true })
    description: string

    /**
     * 项目创建时间
     */
    @Column({ nullable: true, default: () => 'CURRENT_TIMESTAMP' })
    createdAt?: Date

    /**
     * 项目更新时间
     */
    @Column({ nullable: true })
    updatedAt?: Date

    /**
     * 项目所属用户
     * 这就是我们讲到的，表之间的关联关系
     * 这里我们定义了一个多对一的关系，即一个用户可以有多个项目
     * 除了多对一，还有一对一、一对多、多对多等关系
     * 分别为：@OneToOne、@OneToMany、@ManyToMany、
     */
    @ManyToOne('AdminEntity', 'applications')
    user: AdminEntity
}
