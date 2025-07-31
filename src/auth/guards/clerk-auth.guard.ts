import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { UsersService } from '../../users/users.service';

export interface UserPayload {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = this.extractSessionId(request);

    if (!sessionId) {
      throw new UnauthorizedException('Session ID required');
    }

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

      // Attach user to request
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName,
        lastName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return true;
    } catch (error) {
      this.logger.error('Authentication failed', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractSessionId(request: any): string | undefined {
    const sessionHeader = request.headers['x-session-id'];
    if (sessionHeader) {
      return sessionHeader;
    }

    // Also check Authorization header for Bearer token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
}
