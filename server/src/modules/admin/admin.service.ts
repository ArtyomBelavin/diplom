import { BadRequestException, Injectable } from '@nestjs/common';
import { MediaType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    const hasInvalidMedia = dto.media.some(
      (item) => item.mediaType === 'IMAGE' && !item.altText.trim(),
    );

    if (hasInvalidMedia) {
      throw new BadRequestException(
        'Для каждого смыслового изображения необходимо указать alt-текст.',
      );
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Выбранная категория не найдена.');
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          categoryId: dto.categoryId,
          sku: dto.sku,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stockQty: dto.stockQty,
          isActive: dto.isActive ?? true,
          characteristics: dto.characteristics ?? {},
          badge: 'Новый товар',
          media: {
            create: dto.media.map((item, index) => ({
              mediaType:
                item.mediaType === 'VIDEO' ? MediaType.VIDEO : MediaType.IMAGE,
              fileUrl: item.fileUrl,
              altText: item.altText,
              captionUrl: item.captionUrl,
              transcriptUrl: item.transcriptUrl,
              sortOrder: index + 1,
            })),
          },
        },
        include: {
          media: true,
          category: true,
        },
      });

      return {
        message:
          'Товар создан. Accessibility-метаданные медиа сохранены и готовы для публикации.',
        product: {
          ...product,
          price: Number(product.price),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Товар с таким SKU уже существует. Укажите другой артикул.',
        );
      }

      throw error;
    }
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    if (
      dto.media?.some(
        (item) => item.mediaType === 'IMAGE' && !item.altText?.trim(),
      )
    ) {
      throw new BadRequestException(
        'Для каждого смыслового изображения необходимо указать alt-текст.',
      );
    }

    if (dto.media) {
      await this.prisma.productMedia.deleteMany({
        where: { productId: id },
      });
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stockQty: dto.stockQty,
        isActive: dto.isActive,
        characteristics: dto.characteristics,
        ...(dto.media
          ? {
              media: {
                create: dto.media.map((item, index) => ({
                  mediaType:
                    item.mediaType === 'VIDEO'
                      ? MediaType.VIDEO
                      : MediaType.IMAGE,
                  fileUrl: item.fileUrl ?? '',
                  altText: item.altText,
                  captionUrl: item.captionUrl,
                  transcriptUrl: item.transcriptUrl,
                  sortOrder: index + 1,
                })),
              },
            }
          : {}),
      },
      include: {
        media: true,
        category: true,
      },
    });

    return {
      message:
        'Карточка товара обновлена. Проверка обязательных accessibility-данных выполнена.',
      product: {
        ...product,
        price: Number(product.price),
      },
    };
  }

  async updateOrderStatus(id: number, dto: UpdateOrderStatusDto) {
    return {
      message:
        'Статус заказа изменен. Клиентская часть может показать его текстом, а не только цветом.',
      order: await this.prisma.order.update({
        where: { id },
        data: { status: dto.status },
      }),
    };
  }

  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: {
              include: {
                media: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        deliveryMethod: true,
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      deliveryMethod: {
        ...order.deliveryMethod,
        price: Number(order.deliveryMethod.price),
      },
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
}
