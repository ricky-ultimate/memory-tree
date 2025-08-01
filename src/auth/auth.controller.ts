import { Controller, Get, Post, UseGuards, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { UserPayload } from './guards/clerk-auth.guard';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @ApiOperation({
    summary: 'Verify session and sync user',
    description: 'Verifies Clerk session and ensures user exists in database. Creates user if first time login.'
  })
  @ApiHeader({
    name: 'x-session-id',
    description: 'Clerk session ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Session verified and user synced',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/UserResponseDto' },
        isNewUser: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired session' })
  async verifySession(@Headers('x-session-id') sessionId: string) {
    const result = await this.authService.verifyAndSyncUser(sessionId);
    return {
      ...result,
      message: result.isNewUser ? 'Welcome to MemoryTree!' : 'Welcome back!'
    };
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user information', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@GetUser() user: UserPayload): Promise<UserResponseDto> {
    // The user is already synced by the auth guard, just return the current user
    return user as UserResponseDto;
  }

  @Get('session')
  @ApiOperation({ summary: 'Get current session information' })
  @ApiHeader({
    name: 'x-session-id',
    description: 'Clerk session ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Session information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        status: { type: 'string' },
        lastActiveAt: { type: 'number' },
        expireAt: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  async getSession(@Headers('x-session-id') sessionId: string) {
    return this.authService.getCurrentSession(sessionId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke session' })
  @ApiHeader({
    name: 'x-session-id',
    description: 'Clerk session ID',
    required: true,
  })
  @ApiResponse({ status: 204, description: 'Session revoked successfully' })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  async logout(@Headers('x-session-id') sessionId: string): Promise<void> {
    await this.authService.revokeSession(sessionId);
  }
}
