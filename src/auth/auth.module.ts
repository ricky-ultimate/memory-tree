import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [forwardRef(() => UsersModule), ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, SupabaseAuthGuard],
  exports: [AuthService, SupabaseService, SupabaseAuthGuard],
})
export class AuthModule {}
