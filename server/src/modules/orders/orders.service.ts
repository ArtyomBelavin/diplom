import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtPayload } from '../../common/models/store.models';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(
    user: JwtPayload | undefined,
    sessionId: string | undefined,
    dto: CreateOrderDto,
  ) {
    if (!user?.sub) {
      throw new UnauthorizedException(
        'Для оформления заказа необходимо войти в аккаунт.',
      );
    }

    const [cart, delivery, payment] = await Promise.all([
      this.resolveCheckoutCart(user.sub, sessionId),
      this.prisma.deliveryMethod.findFirst({
        where: { id: dto.deliveryMethodId, isActive: true },
      }),
      this.prisma.paymentMethod.findFirst({
        where: { id: dto.paymentMethodId, isActive: true },
      }),
    ]);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException(
        'Корзина пуста. Добавьте товары перед оплатой.',
      );
    }

    if (!delivery || !payment) {
      throw new BadRequestException(
        'Выбранный способ доставки или оплаты недоступен.',
      );
    }

    const unavailableItem = cart.items.find(
      (item) => item.quantity > item.product.stockQty,
    );

    if (unavailableItem) {
      throw new BadRequestException(
        `Недостаточно товара на складе: ${unavailableItem.product.name}. Доступно: ${unavailableItem.product.stockQty} шт.`,
      );
    }

    const itemsTotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.priceAtAdd),
      0,
    );

    const totalAmount = itemsTotal + Number(delivery.price);

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: user.sub,
          deliveryMethodId: dto.deliveryMethodId,
          paymentMethodId: dto.paymentMethodId,
          status: OrderStatus.NEW,
          totalAmount,
          recipientName: dto.recipientName,
          recipientPhone: dto.recipientPhone,
          deliveryAddress: dto.deliveryAddress,
          comment: dto.comment,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.priceAtAdd,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          deliveryMethod: true,
          paymentMethod: true,
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: item.quantity,
            },
          },
        });
      }

      return createdOrder;
    });

    return {
      message:
        'Заказ оформлен. Сервер вернул текстовое подтверждение, которое можно показать в уведомлении и озвучить при включенных подсказках.',
      order: {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: order.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          product: item.product,
        })),
        deliveryMethod: {
          ...order.deliveryMethod,
          price: Number(order.deliveryMethod.price),
        },
        paymentMethod: order.paymentMethod,
      },
    };
  }

  async getMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
        include: {
          product: {
            include: {
              media: {
                orderBy: { sortOrder: 'asc' as const },
              },
            },
          },
        },
      },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        product: {
          ...item.product,
          price: Number(item.product.price),
          media: item.product.media.map((media) => ({
            ...media,
            altText: media.altText ?? '',
          })),
        },
      })),
    }));
  }

  private async resolveCheckoutCart(userId: number, sessionId?: string) {
    let userCart = await this.prisma.cart.findUnique({
      where: { userId },
      include: this.cartInclude(),
    });

    if (!userCart) {
      userCart = await this.prisma.cart.create({
        data: { userId },
        include: this.cartInclude(),
      });
    }

    if (sessionId) {
      const guestCart = await this.prisma.cart.findUnique({
        where: { sessionId },
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
          product: true,
        },
        orderBy: { id: 'asc' as const },
      },
    };
  }
}
