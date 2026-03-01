import { Controller, Post, Body, Get, Query, Request, Res, Req } from '@nestjs/common';
import { Response, Request as ExpressRequest } from 'express';
import { Public } from '../../common/decorators/public.decorator';
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

  @Public()
  @Post('register')
  @Throttle({ 'auth-strict': { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user (requires valid organizationId)' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @Throttle({ 'auth-strict': { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Authenticate and receive JWT tokens' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(loginDto);

    // Set Cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Don't return tokens in the body
    const { accessToken, refreshToken, ...user } = result;
    return user;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refreshToken(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;
    const tokens = await this.authService.refreshToken(refreshToken);

    // Update Cookies
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return { message: 'Token refreshed' };
  }

  /**
   * GET /auth/verify-email?token=<raw-uuid-token>
   *
   * Public endpoint — no JWT required.
   * Validates the token, activates the account, and deletes the token.
   */
  @Public()
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
  @Public()
  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Body() body: { email: string }) {
    return this.emailVerificationService.resendVerificationEmail(body.email);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out and invalidate refresh token' })
  @Post('logout')
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    const commonOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...commonOptions,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
      ...commonOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
