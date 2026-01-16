import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/user.service';

export type JwtUser = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtUser) {
    // Make sure user still exists (and later: isActive)
    const user = await this.users.findById(payload.sub);

    return { id: user.id, email: user.email };
  }
}
