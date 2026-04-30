import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  recipientName!: string;

  @IsString()
  recipientPhone!: string;

  @IsString()
  deliveryAddress!: string;

  @IsInt()
  @Min(1)
  deliveryMethodId!: number;

  @IsInt()
  @Min(1)
  paymentMethodId!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
