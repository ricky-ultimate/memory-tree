import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserPayload } from '../../auth/guards/clerk-auth.guard';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
