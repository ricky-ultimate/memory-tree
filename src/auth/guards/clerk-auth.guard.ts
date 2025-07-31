import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

export interface UserPayload {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = this.extractSessionId(request);

    if (!sessionId) {
      throw new UnauthorizedException('Session ID required');
    }

    try {
      const session = await clerkClient.sessions.getSession(sessionId);

      if (!session || session.status !== 'active') {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const user = await clerkClient.users.getUser(session.userId);
      const email = user.emailAddresses[0]?.emailAddress;
      const firstName = user.firstName;
      const lastName = user.lastName;
      const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || email?.split('@')[0];

      request.user = {
        id: user.id,
        email,
        firstName,
        lastName,
        name,
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
