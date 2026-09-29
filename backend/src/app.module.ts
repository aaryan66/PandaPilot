import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ChatModule } from './chat/chat.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ChatModule,
    IngestionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
