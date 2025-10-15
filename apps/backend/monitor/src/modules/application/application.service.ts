import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ApplicationEntity } from '../../entities/application.entity'

@Injectable()
export class ApplicationService {
    constructor(
        @InjectRepository(ApplicationEntity)
        private readonly applicationRepository: Repository<ApplicationEntity>
    ) {}

    async create(payload) {
        this.applicationRepository.save(payload)
        return payload
    }

    async update(payload) {
        return payload
    }

    async list(params: { userId: number }) {
        const [data, count] = await this.applicationRepository.findAndCount({
            where: { user: { id: params.userId } },
        })

        return {
            applications: data,
            count,
        }
    }

    async delete(payload: { appId: string; userId: number }) {
        const res = await this.applicationRepository.delete({ appId: payload.appId, user: { id: payload.userId } })

        if (res.affected === 0) {
            return new NotFoundException('Application not found')
        }

        return res.raw[0]
    }
}
