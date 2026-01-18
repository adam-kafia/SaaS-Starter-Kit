import { SetMetadata } from '@nestjs/common';

export const ORG_ROLES_KEY = 'org_roles_required';
export type OrgRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export const RequireOrgRole = (...roles: OrgRole[]) =>
  SetMetadata(ORG_ROLES_KEY, roles);