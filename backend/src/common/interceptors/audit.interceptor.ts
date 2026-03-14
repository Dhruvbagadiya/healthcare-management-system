import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector, ModuleRef } from '@nestjs/core';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';
import { ComplianceService } from '../../modules/compliance/compliance.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly moduleRef: ModuleRef) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const reflector = this.moduleRef.get(Reflector, { strict: false });
        const auditOptions = reflector.getAllAndOverride<AuditOptions>(AUDIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!auditOptions) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const url = request.url;

        return next.handle().pipe(
            tap(async (data) => {
                if (user) {
                    const action = auditOptions.action || `${method} ${url}`;
                    const entityType = auditOptions.entityType || 'unknown';

                    // Extract entityId from params or returned data
                    const entityId = request.params.id || (data && data.id) || 'N/A';

                    const complianceService = this.moduleRef.get(ComplianceService, { strict: false });
                    await complianceService.logDataAccess(
                        user.id,
                        user.organizationId,
                        action,
                        entityType,
                        entityId,
                        `Accessed through API: ${method} ${url}`
                    );
                }
            }),
        );
    }
}
