import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupabaseUserPayload } from '../../auth/supabase.service';

/**
 * Decorator to extract the authenticated Supabase user from the request
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@GetSupabaseUser() user: SupabaseUserPayload) {
 *   return { userId: user.id, email: user.email };
 * }
 * 
 * Or get specific property:
 * @Get('profile')
 * getProfile(@GetSupabaseUser('id') userId: string) {
 *   return { userId };
 * }
 */
export const GetSupabaseUser = createParamDecorator(
  (data: keyof SupabaseUserPayload | undefined, ctx: ExecutionContext): SupabaseUserPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as SupabaseUserPayload;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

// Alias for convenience
export const GetUser = GetSupabaseUser;
