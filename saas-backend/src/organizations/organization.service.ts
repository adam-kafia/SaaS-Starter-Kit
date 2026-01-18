import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteStatus, OrgRole } from '../prisma/generated/enums';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

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

    if (!membership)
      throw new ForbiddenException('Not a member of this organization');

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, createdAt: true },
    });

    if (!org) throw new NotFoundException('Organization not found');

    return { ...org, myRole: membership.role };
  }

  async listMembers(orgId: string) {
    const members = await this.prisma.membership.findMany({
      where: { orgId },
      select: {
        role: true,
        user: { select: { id: true, email: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      ...m.user,
      role: m.role,
    }));
  }
  private inviteTtlMs() {
    // 7 days
    return 7 * 24 * 60 * 60 * 1000;
  }

  private async hashToken(token: string) {
    return bcrypt.hash(token, 10);
  }

  async createInvite(
    orgId: string,
    inviterUserId: string,
    email: string,
    role: OrgRole,
  ) {
    // Ensure inviter is ADMIN/OWNER in org
    const inviter = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: inviterUserId, orgId } },
      select: { role: true },
    });
    if (!inviter)
      throw new ForbiddenException('Not a member of this organization');
    if (!(inviter.role === 'OWNER' || inviter.role === 'ADMIN')) {
      throw new ForbiddenException('Insufficient org role');
    }

    // If already a member, don’t invite
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      const existingMembership = await this.prisma.membership.findUnique({
        where: { userId_orgId: { userId: existingUser.id, orgId } },
        select: { id: true },
      });
      if (existingMembership) {
        throw new BadRequestException(
          'User is already a member of this organization',
        );
      }
    }

    // Create raw token (send to user)
    const token = randomBytes(32).toString('hex');
    const tokenHash = await this.hashToken(token);

    const invite = await this.prisma.organizationInvite.create({
      data: {
        orgId,
        email,
        role,
        tokenHash,
        expiresAt: new Date(Date.now() + this.inviteTtlMs()),
        status: InviteStatus.PENDING,
      },
      select: {
        id: true,
        orgId: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Return the raw token so frontend can display/copy OR you can email it later
    return { invite, token };
  }
  async acceptInvite(token: string, password: string) {
    // Find candidate pending invites that haven’t expired
    const candidates = await this.prisma.organizationInvite.findMany({
      where: {
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Match token against stored hashes
    let matched: (typeof candidates)[number] | null = null;
    for (const inv of candidates) {
      if (await bcrypt.compare(token, inv.tokenHash)) {
        matched = inv;
        break;
      }
    }

    if (!matched) throw new BadRequestException('Invalid or expired invite');

    const result = await this.prisma.$transaction(async (tx) => {
      // Mark invite accepted (idempotency-ish: if already accepted you can decide behavior)
      const invite = await tx.organizationInvite.update({
        where: { id: matched!.id },
        data: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        select: { orgId: true, email: true, role: true },
      });

      // Create or fetch user
      let user = await tx.user.findUnique({ where: { email: invite.email } });

      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: { email: invite.email, passwordHash, isVerified: true },
        });
      }

      // Create membership if not exists
      await tx.membership.upsert({
        where: { userId_orgId: { userId: user.id, orgId: invite.orgId } },
        update: { role: invite.role },
        create: { userId: user.id, orgId: invite.orgId, role: invite.role },
      });

      return { user: { id: user.id, email: user.email }, orgId: invite.orgId };
    });
    const { refreshToken, accessToken } =
      await this.authService.createSessionForUser(result.user);

    return {
      ok: true,
      orgId: result.orgId,
      userId: result.user.id,
      email: result.user.email,
      refreshToken,
      accessToken,
    };
  }
}
