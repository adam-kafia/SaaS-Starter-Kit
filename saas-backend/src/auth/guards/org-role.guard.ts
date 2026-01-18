import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ORG_ROLES_KEY, OrgRole } from '../decorators/require-org-role.decorator';

@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(
      ORG_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const role: OrgRole | undefined = req.org?.role;

    if (!role) throw new ForbiddenException('Missing org context');

    if (!required.includes(role)) {
      throw new ForbiddenException('Insufficient org role');
    }

    return true;
  }
}