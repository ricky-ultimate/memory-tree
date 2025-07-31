import { Module } from '@nestjs/common';
import { FragmentsService } from './fragments.service';
import { FragmentsController } from './fragments.controller';

@Module({
  controllers: [FragmentsController],
  providers: [FragmentsService],
})
export class FragmentsModule {}
