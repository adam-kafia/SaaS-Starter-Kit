import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgRole } from '../prisma/generated/enums';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(userId: string, name: string) {
    // Create org + membership as OWNER atomically
    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name },
        select: { id: true, name: true, createdAt: true },
      });

      await tx.membership.create({
        data: {
          orgId: org.id,
          userId,
          role: OrgRole.OWNER,
        },
      });

      return org;
    });
  }

  async listMyOrganizations(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: {
        role: true,
        organization: { select: { id: true, name: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      myRole: m.role,
    }));
  }

  async getOrganizationForMember(orgId: string, userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
      select: { role: true },
    });

    if (!membership) throw new ForbiddenException('Not a member of this organization');

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, createdAt: true },
    });

    if (!org) throw new NotFoundException('Organization not found');

    return { ...org, myRole: membership.role };
  }
}