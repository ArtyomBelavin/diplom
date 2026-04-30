import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { Public } from '../../common/auth/public.decorator';
import type { JwtPayload } from '../../common/models/store.models';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Public()
  @Get()
  getCart(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-id') sessionId?: string,
  ) {
    return this.cartService.getCart(user, sessionId);
  }

  @Public()
  @Post('items')
  addItem(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user, sessionId, dto);
  }

  @Public()
  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: JwtPayload | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Param('id', ParseIntPipe) itemId: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user, sessionId, itemId, dto);
  }
}
