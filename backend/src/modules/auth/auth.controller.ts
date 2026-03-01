import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private emailVerificationService: EmailVerificationService,
  ) { }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user (requires valid organizationId)' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Authenticate and receive JWT tokens' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  /**
   * GET /auth/verify-email?token=<raw-uuid-token>
   *
   * Public endpoint — no JWT required.
   * Validates the token, activates the account, and deletes the token.
   */
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via one-time token link' })
  @ApiQuery({ name: 'token', required: true, description: 'One-time verification token from email' })
  async verifyEmail(@Query('token') token: string) {
    return this.emailVerificationService.verifyEmail(token);
  }

  /**
   * POST /auth/resend-verification
   *
   * Public endpoint — accepts email, re-issues a token.
   * Response is intentionally vague to prevent email enumeration.
   */
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Body() body: { email: string }) {
    return this.emailVerificationService.resendVerificationEmail(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and invalidate refresh token' })
  @Post('logout')
  async logout(@Request() req: any) {
    return this.authService.logout(req.user.id);
  }
}
