import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly tenantService: TenantService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();

        // 1. Extract from JWT (if already authenticated)
        const user = request.user;
        let organizationId = user?.organizationId;

        // 2. Fallback to Header (for public APIs or initial identification)
        if (!organizationId) {
            organizationId = request.headers['x-tenant-id'] || request.headers['x-organization-id'];
        }

        // 3. Optional: Extract from query/body if needed
        // if (!organizationId) { organizationId = request.query.organizationId; }

        if (!organizationId && this.isTenantRequired(request)) {
            throw new BadRequestException('Organization context (x-tenant-id) is required');
        }

        if (organizationId) {
            this.tenantService.setTenantId(organizationId);
            request.organizationId = organizationId;
        }

        return next.handle();
    }

    private isTenantRequired(request: any): boolean {
        const publicRoutes = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/organizations/slug/',
            '/api/organizations/check-slug',
        ];

        const isPublic = publicRoutes.some(route => request.url.includes(route));
        return !isPublic;
    }
}
