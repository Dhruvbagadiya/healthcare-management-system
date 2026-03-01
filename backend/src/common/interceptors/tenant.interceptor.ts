import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private readonly moduleRef: ModuleRef) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // 1. Extract from JWT (if already authenticated)
        const user = request.user;
        let organizationId = user?.organizationId;

        // 2. Fallback to Header (for public APIs or initial identification)
        if (!organizationId) {
            organizationId = request.headers['x-tenant-id'] || request.headers['x-organization-id'];
        }

        if (!organizationId && this.isTenantRequired(request)) {
            throw new BadRequestException('Organization context (x-tenant-id) is required');
        }

        if (organizationId) {
            // Lazy resolve the Request-Scoped TenantService to bypass Global Interceptor DI bugs
            const contextId = ContextIdFactory.getByRequest(request);
            const tenantService = await this.moduleRef.resolve(TenantService, contextId, { strict: false });

            tenantService.setTenantId(organizationId);
            request.organizationId = organizationId;
            request.tenantId = organizationId; // Also set tenantId for convenience based on previous usages
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
