import { Module } from '@nestjs/common';
import { FragmentsService } from './fragments.service';
import { FragmentsController } from './fragments.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FragmentsController],
  providers: [FragmentsService],
  exports: [FragmentsService],
})
export class FragmentsModule {}
