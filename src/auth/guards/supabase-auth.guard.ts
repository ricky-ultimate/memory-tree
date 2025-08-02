import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService, SupabaseUserPayload } from '../supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    private supabaseService: SupabaseService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No authorization token provided');
      throw new UnauthorizedException('Authorization token required');
    }

    try {
      const user = await this.supabaseService.verifyToken(token);
      
      // Attach user to request object
      request.user = user;
      
      this.logger.debug(`User authenticated: ${user.id}`);
      return true;
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return undefined;
    }

    // Support both "Bearer token" and "token" formats
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return authHeader;
  }
}

// Export the user payload type for use in controllers
export type { SupabaseUserPayload };
