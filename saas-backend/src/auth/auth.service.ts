import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private accessTtl(): number {
    return Number(this.config.get<string>('JWT_ACCESS_TTL_SECONDS') ?? 900);
  }
  private refreshTtl(): number {
    return Number(
      this.config.get<string>('JWT_REFRESH_TTL_SECONDS') ?? 60 * 60 * 24 * 30,
    );
  }
  private async signAccessToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
      expiresIn: this.accessTtl(),
    });
  }
  private async signRefreshToken(payload: JwtPayload) {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: this.refreshTtl(),
    });
  }
  private async hashToken(token: string) {
    return bcrypt.hash(token, 10);
  }
  async register(email: string, password: string) {
    const existing = await this.prisma.user.findMany({ where: { email } });
    if (existing.length > 0)
      throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.signRefreshToken(payload);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtl() * 1000),
      },
    });

    return { user, accessToken, refreshToken };
  }
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.signAccessToken(payload);
    const refreshToken = await this.signRefreshToken(payload);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtl() * 1000),
      },
    });

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
  async refresh(refreshToken: string) {
    // Verify refresh token first
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find a non-revoked stored token that matches (hashed compare)
    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const match = await (async () => {
      for (const t of candidates) {
        if (await bcrypt.compare(refreshToken, t.tokenHash)) return t;
      }
      return null;
    })();

    if (!match) throw new UnauthorizedException('Refresh token revoked');

    // Rotation: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: match.id },
      data: { revokedAt: new Date() },
    });

    const newPayload: JwtPayload = { sub: payload.sub, email: payload.email };
    const accessToken = await this.signAccessToken(newPayload);
    const newRefreshToken = await this.signRefreshToken(newPayload);

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: await this.hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + this.refreshTtl() * 1000),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
  async logout(refreshToken: string) {
    // best-effort revoke
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    for (const t of tokens) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: t.id },
          data: { revokedAt: new Date() },
        });
        return { ok: true };
      }
    }
    return { ok: true };
  }
}
