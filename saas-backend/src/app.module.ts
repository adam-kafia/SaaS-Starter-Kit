import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { OrganizationsModule } from './organizations/organization.module';
@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
