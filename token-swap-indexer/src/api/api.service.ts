import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class ApiService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  async getOrderList(offset: number, limit: number, query?: string) {
    let filter = {};
    if (query?.length) {
      filter = {
        OR: [
          {
            id: {
              contains: query,
            },
          },
          {
            tokenA: {
              contains: query,
            },
          },
          {
            tokenB: {
              contains: query,
            },
          },
        ],
      };
    }

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({
        where: filter,
      }),
      this.prisma.order.findMany({
        where: filter,
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
    ]);

    return { total, orders };
  }

  async getOrderDetail(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        fills: true,
      },
    });

    if (!order) {
      throw new HttpException({ reason: 'not found' }, HttpStatus.NOT_FOUND);
    }

    return order;
  }
}
