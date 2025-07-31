import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';

export interface AuthResult {
  user: UserResponseDto;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Verify session and sync user with database
   * This is called by the auth guard to ensure user exists in our DB
   */
  async verifyAndSyncUser(sessionId: string): Promise<AuthResult> {
    try {
      // Verify session with Clerk
      const session = await clerkClient.sessions.getSession(sessionId);

      if (!session || session.status !== 'active') {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Get user details from Clerk
      const clerkUser = await clerkClient.users.getUser(session.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new UnauthorizedException('User email not found');
      }

      const firstName = clerkUser.firstName;
      const lastName = clerkUser.lastName;
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email.split('@')[0];

      // Find or create user in our database
      const userData = {
        id: clerkUser.id,
        email,
        name,
      };

      const user = await this.usersService.findOrCreate(userData);
      const isNewUser = !user.createdAt || (new Date().getTime() - new Date(user.createdAt).getTime()) < 5000; // Created within last 5 seconds

      this.logger.log(`User authenticated: ${user.id} (${isNewUser ? 'new' : 'existing'})`);

      return {
        user,
        isNewUser,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Failed to verify and sync user', error.stack);
      throw new InternalServerErrorException('Authentication failed');
    }
  }

  /**
   * Get current user session info
   */
  async getCurrentSession(sessionId: string) {
    try {
      const session = await clerkClient.sessions.getSession(sessionId);
      return {
        id: session.id,
        userId: session.userId,
        status: session.status,
        lastActiveAt: session.lastActiveAt,
        expireAt: session.expireAt,
      };
    } catch (error) {
      this.logger.error('Failed to get session info', error.stack);
      throw new UnauthorizedException('Invalid session');
    }
  }

  /**
   * Revoke session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await clerkClient.sessions.revokeSession(sessionId);
      this.logger.log(`Session revoked: ${sessionId}`);
    } catch (error) {
      this.logger.error('Failed to revoke session', error.stack);
      throw new InternalServerErrorException('Failed to logout');
    }
  }
}
