import { Module } from '@nestjs/common';
import { AccessibilitySettingsController } from './accessibility-settings.controller';
import { AccessibilitySettingsService } from './accessibility-settings.service';

@Module({
  controllers: [AccessibilitySettingsController],
  providers: [AccessibilitySettingsService],
})
export class AccessibilitySettingsModule {}
