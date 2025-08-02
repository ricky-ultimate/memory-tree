import { Controller, Get, Post, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { GetSupabaseUser } from '../common/decorators/supabase-user.decorator';
import type { SupabaseUserPayload } from './guards/supabase-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Auth service health check' })
  @ApiResponse({ status: 200, description: 'Auth service is running' })
  getHealth() {
    return {
      status: 'ok',
      service: 'Supabase Auth',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        emailVerified: { type: 'boolean' },
        createdAt: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@GetSupabaseUser() user: SupabaseUserPayload): Promise<SupabaseUserPayload> {
    return user;
  }

  @Public()
  @Post('verify-token')
  @ApiOperation({
    summary: 'Verify JWT token',
    description: 'Verifies a Supabase JWT token and returns user information'
  })
  @ApiResponse({
    status: 200,
    description: 'Token verified successfully',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyToken(@Body() body: { token: string }) {
    try {
      const user = await this.supabaseService.verifyToken(body.token);
      return {
        valid: true,
        user
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}
