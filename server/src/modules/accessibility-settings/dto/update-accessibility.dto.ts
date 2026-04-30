import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateAccessibilityDto {
  @IsOptional()
  @IsInt()
  @Min(90)
  @Max(150)
  fontScale?: number;

  @IsOptional()
  @IsIn(['default', 'high'])
  contrastMode?: 'default' | 'high';

  @IsOptional()
  @IsIn(['normal', 'wide'])
  lineSpacing?: 'normal' | 'wide';

  @IsOptional()
  @IsBoolean()
  hideImages?: boolean;

  @IsOptional()
  @IsBoolean()
  reducedMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceHints?: boolean;

  @IsOptional()
  @IsBoolean()
  captionsDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  focusHighlight?: boolean;
}
