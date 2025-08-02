import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (no authentication required)
 * 
 * Usage:
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 */
export const Public = () => SetMetadata('isPublic', true);
