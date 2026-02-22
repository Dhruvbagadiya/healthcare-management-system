import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { AuditService } from './services/audit.service';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AuditLog])],
  providers: [S3Service, AuditService],
  exports: [S3Service, AuditService],
})
export class CommonModule {}
