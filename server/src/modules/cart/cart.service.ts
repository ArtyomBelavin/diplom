import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/models/store.models';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(user: JwtPayload | undefined, sessionId: string | undefined) {
    const cart = await this.resolveCart(user, sessionId);
    return {
      ...this.serializeCart(cart),
      message:
        'Корзина доступна для гостя и авторизованного пользователя. Все изменения сопровождаются текстовыми уведомлениями.',
    };
  }

  async addItem(
    user: JwtPayload | undefined,
    sessionId: string | undefined,
    dto: AddCartItemDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Товар не найден.');
    }

    const cart = await this.resolveCart(user, sessionId);
    const existingItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + dto.quantity;

      if (nextQuantity > product.stockQty) {
        throw new BadRequestException(
          `Недостаточно товара на складе. Доступно: ${product.stockQty} шт.`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: nextQuantity,
        },
      });
    } else {
      if (dto.quantity > product.stockQty) {
        throw new BadRequestException(
          `Недостаточно товара на складе. Доступно: ${product.stockQty} шт.`,
        );
      }

      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          priceAtAdd: product.price,
        },
      });
    }

    return {
      message:
        'Товар добавлен в корзину. Клиент может озвучить это уведомление через live-область или voice hints.',
      cart: await this.getCart(user, sessionId),
    };
  }

  async updateItem(
    user: JwtPayload | undefined,
    sessionId: string | undefined,
    itemId: number,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.resolveCart(user, sessionId, false);
    const item = cart.items.find((entry) => entry.id === itemId);

    if (!item) {
      throw new NotFoundException('Позиция корзины не найдена.');
    }

    if (item.cartId !== cart.id) {
      throw new ForbiddenException('Нельзя изменять чужую корзину.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Товар не найден.');
    }

    if (dto.quantity > product.stockQty) {
      throw new BadRequestException(
        `Недостаточно товара на складе. Доступно: ${product.stockQty} шт.`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });

    return {
      message: 'Количество товара обновлено. Итог корзины пересчитан.',
      cart: await this.getCart(user, sessionId),
    };
  }

  private async resolveCart(
    user: JwtPayload | undefined,
    sessionId: string | undefined,
    mergeGuestCart = true,
  ) {
    if (user?.sub) {
      let userCart = await this.prisma.cart.findUnique({
        where: { userId: user.sub },
        include: this.cartInclude(),
      });

      if (!userCart) {
        userCart = await this.prisma.cart.create({
          data: { userId: user.sub },
          include: this.cartInclude(),
        });
      }

      const guestSessionId = sessionId || null;
      if (mergeGuestCart && guestSessionId) {
        const guestCart = await this.prisma.cart.findUnique({
          where: { sessionId: guestSessionId },
          include: this.cartInclude(),
        });

        if (guestCart && guestCart.id !== userCart.id) {
          await this.mergeGuestCartIntoUserCart(guestCart.id, userCart.id);
        }
      }

      return this.prisma.cart.findUniqueOrThrow({
        where: { id: userCart.id },
        include: this.cartInclude(),
      });
    }

    const guestSessionId = sessionId || 'guest-demo';
    const existingCart = await this.prisma.cart.findUnique({
      where: { sessionId: guestSessionId },
      include: this.cartInclude(),
    });

    if (existingCart) {
      return existingCart;
    }

    return this.prisma.cart.create({
      data: { sessionId: guestSessionId },
      include: this.cartInclude(),
    });
  }

  private async mergeGuestCartIntoUserCart(
    guestCartId: number,
    userCartId: number,
  ) {
    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartId: guestCartId },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const item of guestItems) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: userCartId,
            productId: item.productId,
          },
        });

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + item.quantity,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCartId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtAdd: item.priceAtAdd,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({
        where: { cartId: guestCartId },
      });

      await tx.cart.delete({
        where: { id: guestCartId },
      });
    });
  }

  private cartInclude() {
    return {
      items: {
        include: {
          product: {
            include: {
              media: {
                orderBy: { sortOrder: 'asc' as const },
              },
              category: true,
            },
          },
        },
        orderBy: { id: 'asc' as const },
      },
    };
  }

  private serializeCart(cart: {
    id: number;
    items: Array<{
      id: number;
      cartId: number;
      productId: number;
      quantity: number;
      priceAtAdd: { toString(): string };
      product: {
        id: number;
        name: string;
        price: { toString(): string };
        stockQty: number;
        characteristics: unknown;
        media: Array<{ fileUrl: string; altText: string | null }>;
      };
    }>;
  }) {
    const items = cart.items.map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtAdd: Number(item.priceAtAdd),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        stockQty: item.product.stockQty,
        characteristics:
          item.product.characteristics &&
          typeof item.product.characteristics === 'object' &&
          !Array.isArray(item.product.characteristics)
            ? (item.product.characteristics as Record<string, string>)
            : {},
        media: item.product.media.map((media) => ({
          fileUrl: media.fileUrl,
          altText: media.altText ?? '',
        })),
      },
    }));

    return {
      id: cart.id,
      items,
      total: items.reduce(
        (sum, item) => sum + item.quantity * item.priceAtAdd,
        0,
      ),
    };
  }
}
