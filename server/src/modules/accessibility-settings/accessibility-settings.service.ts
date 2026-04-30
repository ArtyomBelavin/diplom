import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAccessibilityDto } from './dto/update-accessibility.dto';

@Injectable()
export class AccessibilitySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  getSettings(userId: number) {
    return this.prisma.accessibilitySettings.findUniqueOrThrow({
      where: { userId },
    });
  }

  async updateSettings(userId: number, dto: UpdateAccessibilityDto) {
    return {
      message:
        'Настройки доступности сохранены. Изменения можно сразу применять на клиенте без перезагрузки.',
      settings: await this.prisma.accessibilitySettings.update({
        where: { userId },
        data: dto,
      }),
    };
  }
}
