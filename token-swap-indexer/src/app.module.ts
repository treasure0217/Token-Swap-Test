import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IndexerModule } from './indexer/indexer.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [IndexerModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule {}
