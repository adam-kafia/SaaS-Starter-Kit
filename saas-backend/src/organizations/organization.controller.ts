import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { OrganizationsService } from './organization.service';
import { User } from '../auth/decorators/user.decorator';
import { CreateOrganizationDto } from './dto/createOrganization.dto';
import { OrgMemberGuard } from '../auth/guards/org-member.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRoleGuard } from '../auth/guards/org-role.guard';
import { RequireOrgRole } from '../auth/decorators/require-org-role.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateOrganizationDto) {
    return this.orgs.createOrganization(user.id, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@User() user: { id: string }) {
    return this.orgs.listMyOrganizations(user.id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard)
  @Get('active')
  activeOrg(@CurrentOrg() org: { orgId: string; role: string }) {
    return org; // { orgId, role }
  }

  @Post('invites/accept')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.orgs.acceptInvite(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole('OWNER', 'ADMIN')
  @Get(':orgId/members')
  members(@Param('orgId') orgId: string) {
    return this.orgs.listMembers(orgId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orgId')
  getOne(@User() user: { id: string }, @Param('orgId') orgId: string) {
    return this.orgs.getOrganizationForMember(orgId, user.id);
  }

  @UseGuards(JwtAuthGuard, OrgMemberGuard, OrgRoleGuard)
  @RequireOrgRole('OWNER', 'ADMIN')
  @Post(':orgId/invites')
  createInvite(
    @User() user: { id: string },
    @Param('orgId') orgId: string,
    @Body() dto: CreateInviteDto,
  ) {
    const role = (dto.role ?? 'MEMBER') as any;
    return this.orgs.createInvite(orgId, user.id, dto.email, role);
  }
}
