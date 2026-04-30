import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductMediaDto {
  @IsIn(['IMAGE', 'VIDEO'])
  mediaType!: 'IMAGE' | 'VIDEO';

  @IsString()
  fileUrl!: string;

  @IsString()
  @IsNotEmpty()
  altText!: string;

  @IsOptional()
  @IsString()
  captionUrl?: string;

  @IsOptional()
  @IsString()
  transcriptUrl?: string;
}

export class CreateProductDto {
  @IsInt()
  @Min(1)
  categoryId!: number;

  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  characteristics?: Record<string, string>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaDto)
  media!: ProductMediaDto[];
}
