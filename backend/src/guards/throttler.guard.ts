import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage, InjectThrottlerOptions, InjectThrottlerStorage } from '@nestjs/throttler';

/**
 * CustomThrottlerGuard — Enterprise-grade rate limiting guard.
 *
 * - Bypasses throttling for Swagger documentation routes (/api/docs).
 * - Tracks by IP address from the forwarded header (Vercel / Railway proxy-aware).
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    constructor(
        @InjectThrottlerOptions() options: ThrottlerModuleOptions,
        @InjectThrottlerStorage() storageService: ThrottlerStorage,
        reflector: Reflector,
    ) {
        super(options, storageService, reflector);
    }

    /**
     * Skip throttle check for Swagger UI and its JSON spec.
     */
    protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const url: string = req.url || '';
        if (url.startsWith('/api/docs') || url === '/api-json') {
            return true;
        }
        return super.shouldSkip(context);
    }

    /**
     * Use the real client IP even behind a reverse proxy.
     * Falls back to `req.ip` when no proxy header is present (local dev).
     */
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const forwarded = req.headers?.['x-forwarded-for'];
        const ip = Array.isArray(forwarded)
            ? forwarded[0]
            : (forwarded as string)?.split(',')[0]?.trim() ?? req.ip;
        return ip;
    }
}
