import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/models/store.models';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Get('favorites')
  getFavorites(@CurrentUser() user: JwtPayload) {
    return this.usersService.getFavorites(user.sub);
  }

  @Post('favorites/:productId')
  addFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.usersService.addFavorite(user.sub, productId);
  }

  @Delete('favorites/:productId')
  removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.usersService.removeFavorite(user.sub, productId);
  }
}
