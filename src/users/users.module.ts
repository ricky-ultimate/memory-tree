import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, ClerkAuthGuard],
  exports: [UsersService, ClerkAuthGuard],
})
export class UsersModule {}
