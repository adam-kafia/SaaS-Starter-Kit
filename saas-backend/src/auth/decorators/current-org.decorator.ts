import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OrgContext } from '../types/org-context.type';

export const CurrentOrg = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): OrgContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.org;
  },
);