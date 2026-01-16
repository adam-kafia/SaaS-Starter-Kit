import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserType } from '../types/current-user.type';

export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
