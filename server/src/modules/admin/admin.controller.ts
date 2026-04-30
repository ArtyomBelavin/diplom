import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { Roles } from '../../common/auth/roles.decorator';
import { RoleName } from '../../common/models/store.models';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('admin')
@Roles(RoleName.ADMIN, RoleName.CONTENT_MANAGER)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('uploads/image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          callback(null, uploadDir);
        },
        filename: (_req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        callback(null, file.mimetype.startsWith('image/'));
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: { filename: string },
    @Req() req: { protocol: string; get(name: string): string | undefined },
    @Headers('x-forwarded-proto') forwardedProto?: string,
  ) {
    return {
      message: 'Изображение загружено.',
      fileUrl: `/uploads/${file.filename}`,
    };
  }

  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Get('orders')
  @Roles(RoleName.ADMIN)
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(id, dto);
  }

  @Patch('orders/:id/status')
  @Roles(RoleName.ADMIN)
  updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }
}
