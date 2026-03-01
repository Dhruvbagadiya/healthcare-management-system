import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: any) => {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies.accessToken;
        }
        if (!token && req.headers.authorization) {
          token = req.headers.authorization.replace('Bearer ', '');
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
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
