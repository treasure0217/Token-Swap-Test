import { Injectable, Logger } from '@nestjs/common';
import {
  EventFilter,
  JsonRpcProvider,
  Interface,
  Log,
  LogDescription,
} from 'ethers';
import * as TokenSwapAbi from 'src/helper/abis/TokenSwap.abi.json';
import { PrismaService } from 'src/config/prisma.service';
import { retryRPCPromise } from 'src/helper/retryRPCPromise';
import { configService } from 'src/config/config.service';

@Injectable()
export class IndexerService {
  private logger: Logger;
  private prisma: PrismaService;

  private filters: EventFilter[];
  private provider: JsonRpcProvider;
  private lastBlock: number;
  private bridgeInterface: Interface;

  constructor() {
    this.logger = new Logger(IndexerService.name);
    this.prisma = new PrismaService();

    this.init();
  }

  private async init() {
    this.logger.log('Initializing...');

    this.provider = new JsonRpcProvider(configService.getRpcUrl());
    this.bridgeInterface = new Interface(TokenSwapAbi);
    const contractAddress = configService.getContractAddress();

    this.filters = [
      {
        address: contractAddress,
        topics: [this.bridgeInterface.getEvent('OrderCreated').topicHash],
      },
      {
        address: contractAddress,
        topics: [this.bridgeInterface.getEvent('OrderCancelled').topicHash],
      },
      {
        address: contractAddress,
        topics: [this.bridgeInterface.getEvent('OrderFilled').topicHash],
      },
    ];

    const lastScan = await this.prisma.scanHistory.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (lastScan) {
      this.lastBlock = lastScan.end;
    } else {
      this.lastBlock = configService.getStartBlockNumber() - 1;
    }

    this.logger.log('Initialized indexer');
    this.filterEvents();
  }

  private async filterEvents() {
    try {
      this.provider.removeAllListeners();
      const headBlock = await this.provider.getBlockNumber();
      if (this.lastBlock >= headBlock) {
        throw new Error('duplicated event');
      }

      const endBlock =
        headBlock > this.lastBlock + 1000 ? this.lastBlock + 1000 : headBlock;

      this.logger.log(
        `Fetching blocks from ${this.lastBlock + 1} to ${endBlock}`,
      );
      let logs: Log[] = [];
      for (const filter of this.filters) {
        const getLogPromise = () =>
          this.provider.getLogs({
            ...filter,
            fromBlock: this.lastBlock + 1,
            toBlock: endBlock,
          });
        const result = await retryRPCPromise<Log[]>(getLogPromise, 2);
        logs = logs.concat(result);
      }

      this.logger.log(
        `Found ${logs.length} event(s) between ${this.lastBlock + 1} to ${endBlock}`,
      );

      for (const log of logs) {
        try {
          const factoryDescription = this.bridgeInterface.parseLog({
            data: log.data,
            topics: [...log.topics],
          });
          if (factoryDescription) {
            await this.handleBridgeLog(factoryDescription);
          }
        } catch (err) {
          console.log(err);
        }
      }

      if (logs.length) {
        await this.prisma.scanHistory.create({
          data: {
            start: this.lastBlock + 1,
            end: this.lastBlock,
          },
        });
      }

      this.lastBlock = endBlock;
    } catch (err) {
      this.logger.error(err);
    }
    this.provider.addListener('block', () => this.filterEvents());
  }

  private async handleBridgeLog(description: LogDescription) {
    if (description.name == 'OrderCreated') {
      await this.handleCreate(description);
    }
    if (description.name == 'OrderCancelled') {
      await this.handleCancel(description);
    }
    if (description.name == 'OrderFilled') {
      await this.handleFill(description);
    }
  }

  private async handleCreate(description: LogDescription) {
    const [id, seller, tokenA, tokenB, amountA, amountB] = description.args;

    await this.prisma.order.create({
      data: {
        id: id,
        status: 'Active',
        seller: seller,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: (amountA as bigint).toString(),
        amountB: (amountB as bigint).toString(),
      },
    });

    this.logger.log(`New order ${id}`);
  }

  private async handleCancel(description: LogDescription) {
    const [id] = description.args;

    const order = await this.prisma.order.findUnique({
      where: {
        id: id,
      },
    });
    if (!order) {
      return;
    }

    await this.prisma.order.update({
      where: {
        id: id,
      },
      data: {
        amountA: '0',
        amountB: '0',
        status: 'Cancelled',
      },
    });

    this.logger.log(`Cancel order ${id}`);
  }

  private async handleFill(description: LogDescription) {
    const [id, buyer, amountB, amountA] = description.args;

    const order = await this.prisma.order.findUnique({
      where: {
        id: id,
      },
    });
    if (!order) {
      return;
    }

    const afterAmountA = BigInt(order.amountA) - amountA;
    const afterAmountB = BigInt(order.amountB) - amountB;

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: {
          id: id,
        },
        data: {
          amountA: afterAmountA.toString(),
          amountB: afterAmountB.toString(),
          status: afterAmountA == 0n ? 'Filled' : 'Active',
        },
      }),
      this.prisma.orderFill.create({
        data: {
          buyer: buyer,
          amountA: (amountA as bigint).toString(),
          amountB: (amountB as bigint).toString(),
          orderId: id,
        },
      }),
    ]);

    this.logger.log(`Fill order ${id}`);
  }
}
