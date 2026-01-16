import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { OrganizationsService } from './organization.service';
import { User } from '../auth/decorators/user.decorator';
import { CreateOrganizationDto } from './dto/createOrganization.dto';
import { OrgMemberGuard } from '../auth/guards/org-member.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@UseGuards(JwtAuthGuard, OrgMemberGuard)
@Controller('orgs')
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Post()
  create(@User() user: { id: string }, @Body() dto: CreateOrganizationDto) {
    return this.orgs.createOrganization(user.id, dto.name);
  }

  @Get('mine')
  mine(@User() user: { id: string }) {
    return this.orgs.listMyOrganizations(user.id);
  }

  @Get('active')
  activeOrg(@CurrentOrg() org: { orgId: string; role: string }) {
    return org; // { orgId, role }
  }

  @Get(':orgId')
  getOne(@User() user: { id: string }, @Param('orgId') orgId: string) {
    return this.orgs.getOrganizationForMember(orgId, user.id);
  }
}
