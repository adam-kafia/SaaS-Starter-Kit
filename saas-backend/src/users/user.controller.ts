import { Controller, Get, UseGuards } from '@nestjs/common';
import { User } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { UsersService } from './user.service';

@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@User() user: { id: string; email: string }) {
    return this.userService.findById(user.id);
  }
}
