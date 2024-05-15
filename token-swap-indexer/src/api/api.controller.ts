import { Controller, Get, UseInterceptors, Param, Query } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiTags } from '@nestjs/swagger';
import { BigintInterceptor } from 'src/interceptors/bigint.interceptor';

ApiTags('/api');
@Controller('api')
@UseInterceptors(BigintInterceptor)
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/')
  getOrderList(
    @Query('offset') offset: string = '0',
    @Query('limit') limit: string = '10',
    @Query('query') query: string,
  ) {
    return this.apiService.getOrderList(+offset, +limit, query);
  }

  @Get('/:id')
  getOrderDetail(@Param('id') id: string) {
    return this.apiService.getOrderDetail(id);
  }
}
