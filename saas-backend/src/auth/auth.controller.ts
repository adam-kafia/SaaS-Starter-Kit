import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private cookieOptions(): CookieOptions {
    const secure = this.config.get('COOKIE_SECURE') === 'true';
    const sameSite = (this.config.get('COOKIE_SAMESITE') ?? 'lax') as
      | 'lax'
      | 'strict'
      | 'none';
    const domain = this.config.get('COOKIE_DOMAIN') || undefined;

    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth',
      maxAge:
        Number(this.config.get('JWT_REFRESH_TTL_SECONDS') ?? 2592000) * 1000,
    };
  }

  private refreshCookieName() {
    return this.config.get('REFRESH_COOKIE_NAME') ?? 'refresh_token';
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.register(
      dto.email,
      dto.password,
    );

    res.cookie(this.refreshCookieName(), refreshToken, this.cookieOptions());

    // Return access token in JSON; refresh token is only in cookie
    return { user, accessToken };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(
      dto.email,
      dto.password,
    );

    res.cookie(this.refreshCookieName(), refreshToken, this.cookieOptions());

    return { user, accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[this.refreshCookieName()];
    const { accessToken, refreshToken: newRefresh } =
      await this.auth.refresh(token);

    // Rotate cookie
    res.cookie(this.refreshCookieName(), newRefresh, this.cookieOptions());

    return { accessToken };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[this.refreshCookieName()];
    if (token) await this.auth.logout(token);

    res.clearCookie(this.refreshCookieName(), { ...this.cookieOptions(), maxAge: 0 });

    return { ok: true };
  }
}
