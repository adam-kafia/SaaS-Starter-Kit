import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    // Requires JwtAuthGuard to have already set req.user
    const userId: string | undefined = req.user?.id;
    if (!userId) throw new ForbiddenException('Not authenticated');

    const orgId = req.header('x-org-id') as string | undefined;
    if (!orgId) throw new BadRequestException('Missing X-Org-Id header');

    const membership = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
      select: { role: true },
    });

    if (!membership)
      throw new ForbiddenException('Not a member of this organization');

    // Attach org context for downstream usage
    req.org = { orgId, role: membership.role };

    return true;
  }
}
