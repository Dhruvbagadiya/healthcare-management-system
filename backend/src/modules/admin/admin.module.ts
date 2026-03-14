import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role])],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
