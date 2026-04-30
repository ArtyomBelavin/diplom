import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/models/store.models';
import { AccessibilitySettingsService } from './accessibility-settings.service';
import { UpdateAccessibilityDto } from './dto/update-accessibility.dto';

@Controller('accessibility-settings')
export class AccessibilitySettingsController {
  constructor(
    private readonly accessibilitySettingsService: AccessibilitySettingsService,
  ) {}

  @Get()
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.accessibilitySettingsService.getSettings(user.sub);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAccessibilityDto,
  ) {
    return this.accessibilitySettingsService.updateSettings(user.sub, dto);
  }
}
