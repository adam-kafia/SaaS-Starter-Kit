import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER'])
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}