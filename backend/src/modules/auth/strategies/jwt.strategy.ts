import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        '[FATAL] JWT_SECRET environment variable is not set. '
        + 'JwtStrategy cannot be initialised without a secure secret.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Authorization header first (SPA / mobile clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fall back to httpOnly cookie (SSR / cookie-based clients)
        (req: any) => {
          return req?.cookies?.accessToken ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Hard requirement: every authenticated request must carry a verified org context.
    if (!payload.organizationId) {
      throw new UnauthorizedException(
        'Token does not contain a valid organization context. Re-login required.',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      userId: payload.userId,
      roles: (payload.roles ?? []).map((r: string) => r.toLowerCase()),
      organizationId: payload.organizationId,
    };
  }
}
