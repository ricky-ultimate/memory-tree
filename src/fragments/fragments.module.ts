import { Module } from '@nestjs/common';
import { FragmentsService } from './fragments.service';
import { FragmentsController } from './fragments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [FragmentsController],
  providers: [FragmentsService, ClerkAuthGuard],
  exports: [FragmentsService],
})
export class FragmentsModule {}
