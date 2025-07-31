import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  value: any;
  constraints: string[];
}

interface ValidationErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  validationErrors: ValidationError[];
}

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Check if this is a validation error
    if (Array.isArray(exceptionResponse.message)) {
      const validationErrors: ValidationError[] = exceptionResponse.message.map(
        (error: any) => {
          if (typeof error === 'string') {
            return {
              field: 'unknown',
              value: null,
              constraints: [error],
            };
          }

          return {
            field: error.property || 'unknown',
            value: error.value,
            constraints: error.constraints 
              ? Object.values(error.constraints) 
              : [error.message || 'Invalid value'],
          };
        },
      );

      const errorResponse: ValidationErrorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: 'Validation failed',
        error: 'ValidationError',
        validationErrors,
      };

      this.logger.warn(
        `Validation failed for ${request.method} ${request.url}`,
        validationErrors,
      );

      response.status(status).json(errorResponse);
    } else {
      // Not a validation error, let the main exception filter handle it
      throw exception;
    }
  }
}
