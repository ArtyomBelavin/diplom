import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ProductQuery = {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  getCategories() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getProducts(query: ProductQuery) {
    const q = query.q?.trim().toLowerCase();
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(24, Math.max(1, query.limit ?? 12));
    const where = {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.category
        ? {
            category: {
              slug: query.category,
            },
          }
        : {}),
      ...(typeof query.minPrice === 'number'
        ? {
            price: {
              gte: query.minPrice,
              ...(typeof query.maxPrice === 'number'
                ? { lte: query.maxPrice }
                : {}),
            },
          }
        : typeof query.maxPrice === 'number'
          ? {
              price: {
                lte: query.maxPrice,
              },
            }
          : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy:
          query.sort === 'price-desc'
            ? { price: 'desc' }
            : query.sort === 'price-asc'
              ? { price: 'asc' }
              : [{ id: 'asc' }],
        include: {
          category: true,
          media: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    const hasMore = page * limit < total;

    return {
      items: items.map((product) => this.serializeProduct(product)),
      total,
      page,
      limit,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      message: `Найдено товаров: ${total}. Активные фильтры и сортировка применены.`,
    };
  }

  async getProduct(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          include: {
            user: true,
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Карточка товара не найдена.');
    }

    return {
      ...this.serializeProduct(product),
      reviews: product.reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        advantages: review.advantages,
        disadvantages: review.disadvantages,
        comment: review.comment,
        authorName: review.user.fullName,
      })),
    };
  }

  async getStoreMeta() {
    const [deliveryMethods, paymentMethods] = await Promise.all([
      this.prisma.deliveryMethod.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.paymentMethod.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' },
      }),
    ]);

    return {
      deliveryMethods: deliveryMethods.map((method) => ({
        ...method,
        price: Number(method.price),
      })),
      paymentMethods,
    };
  }

  private serializeProduct(product: {
    id: number;
    categoryId: number;
    sku: string;
    name: string;
    description: string;
    price: { toString(): string };
    stockQty: number;
    isActive: boolean;
    badge: string | null;
    characteristics: unknown;
    category?: {
      id: number;
      name: string;
      slug: string;
      sortOrder: number;
      parentId: number | null;
    } | null;
    media?: Array<{
      id: number;
      fileUrl: string;
      altText: string | null;
      mediaType: string;
      captionUrl: string | null;
      transcriptUrl: string | null;
      sortOrder: number;
    }>;
  }) {
    return {
      id: product.id,
      categoryId: product.categoryId,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stockQty: product.stockQty,
      isActive: product.isActive,
      badge: product.badge ?? undefined,
      characteristics:
        product.characteristics &&
        typeof product.characteristics === 'object' &&
        !Array.isArray(product.characteristics)
          ? (product.characteristics as Record<string, string>)
          : {},
      category: product.category ?? undefined,
      media:
        product.media?.map((item) => ({
          id: item.id,
          mediaType: item.mediaType,
          fileUrl: item.fileUrl,
          altText: item.altText ?? '',
          captionUrl: item.captionUrl ?? undefined,
          transcriptUrl: item.transcriptUrl ?? undefined,
          sortOrder: item.sortOrder,
        })) ?? [],
    };
  }
}
