import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminEntity } from '../../entities/admin.entity'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

@Module({
    imports: [TypeOrmModule.forFeature([AdminEntity])],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
