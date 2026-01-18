import { Module } from '@nestjs/common';
import { OrganizationsController } from './organization.controller';
import { OrganizationsService } from './organization.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  imports: [AuthModule],
})
export class OrganizationsModule {}
