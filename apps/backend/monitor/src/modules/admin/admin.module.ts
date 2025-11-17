import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminEntity } from '../../entities/admin.entity'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { ProfileController } from './profile.controller'

@Module({
    imports: [TypeOrmModule.forFeature([AdminEntity])],
    controllers: [AdminController, ProfileController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
