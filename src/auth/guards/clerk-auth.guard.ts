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

      request.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
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
  }
}
