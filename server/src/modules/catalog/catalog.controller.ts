import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @Public()
  @Get('products')
  getProducts(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.catalogService.getProducts({
      q,
      category,
      sort,
      minPrice,
      maxPrice,
      page,
      limit,
    });
  }

  @Public()
  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.getProduct(id);
  }

  @Public()
  @Get('meta')
  getMeta() {
    return this.catalogService.getStoreMeta();
  }
}
