import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { FragmentsModule } from './fragments/fragments.module';

@Module({
  imports: [UsersModule, FragmentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
