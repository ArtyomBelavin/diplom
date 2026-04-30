import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['NEW', 'CONFIRMED', 'ASSEMBLING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status!:
    | 'NEW'
    | 'CONFIRMED'
    | 'ASSEMBLING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
}
