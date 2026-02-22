import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async logAction(
    userId: string,
    userEmail: string,
    action: AuditAction,
    entityType: string,
    entityId: string | null,
    request: Request,
    changes?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const auditLog = new AuditLog({
        userId,
        userEmail,
        action,
        entityType,
        entityId,
        changes,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
        success: !errorMessage,
        errorMessage,
      });

      await this.auditRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to log audit: ${error.message}`);
    }
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    let query = this.auditRepository.createQueryBuilder('audit');

    if (filters?.userId) {
      query = query.where('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters?.action) {
      query = query.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    if (filters?.entityType) {
      query = query.andWhere('audit.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }

    if (filters?.startDate) {
      query = query.andWhere('audit.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query = query.andWhere('audit.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return query.orderBy('audit.createdAt', 'DESC').take(1000).getMany();
  }
}
