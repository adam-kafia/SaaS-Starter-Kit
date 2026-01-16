import { Module } from '@nestjs/common';
import { OrganizationsController } from './organization.controller';
import { OrganizationsService } from './organization.service';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
