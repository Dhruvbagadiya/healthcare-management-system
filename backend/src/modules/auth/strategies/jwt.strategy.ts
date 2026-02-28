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
          token = req.cookies.Authorization;
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
      console.error('Invalid JWT payload:', payload);
      throw new UnauthorizedException('Invalid token payload');
    }

    console.log(`Validated token for user: ${payload.email} (sub: ${payload.sub})`);

    return {
      id: payload.sub,
      email: payload.email,
      userId: payload.userId,
      roles: payload.roles,
      organizationId: payload.organizationId,
    };
  }
}
