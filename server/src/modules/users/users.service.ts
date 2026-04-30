import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        favorites: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден.');
    }

    return {
      id: user.id,
      role: user.role.name,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      createdAt: user.createdAt,
      favorites: user.favorites,
    };
  }

  async getFavorites(userId: number) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            media: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((favorite) => ({
      id: favorite.id,
      productId: favorite.productId,
      createdAt: favorite.createdAt,
      product: {
        id: favorite.product.id,
        name: favorite.product.name,
        description: favorite.product.description,
        price: Number(favorite.product.price),
        stockQty: favorite.product.stockQty,
        badge: favorite.product.badge ?? undefined,
        category: favorite.product.category,
        media: favorite.product.media.map((media) => ({
          fileUrl: media.fileUrl,
          altText: media.altText ?? '',
        })),
      },
    }));
  }

  async addFavorite(userId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Товар не найден.');
    }

    await this.prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });

    return {
      message: 'Товар добавлен в избранное.',
    };
  }

  async removeFavorite(userId: number, productId: number) {
    await this.prisma.favorite.deleteMany({
      where: {
        userId,
        productId,
      },
    });

    return {
      message: 'Товар удалён из избранного.',
    };
  }
}
