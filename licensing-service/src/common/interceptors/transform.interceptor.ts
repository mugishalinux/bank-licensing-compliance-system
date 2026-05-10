import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

const defaultMsg: Record<string, string> = {
  GET: 'OK',
  POST: 'Created',
  PUT: 'Updated',
  PATCH: 'Updated',
  DELETE: 'Deleted',
};

function isPaginated(d: any) {
  return d && typeof d === 'object' && 'items' in d && 'total' in d;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const custom = this.reflector.get<string>(RESPONSE_MESSAGE_KEY, ctx.getHandler());
    const message = custom || defaultMsg[req.method] || 'OK';

    return next.handle().pipe(
      map((data) => {
        if (isPaginated(data)) {
          const { items, total, page, pageSize, totalPages, hasNext, hasPrev } = data;
          return {
            success: true,
            message,
            data: items,
            pagination: { total, page, pageSize, totalPages, hasNext, hasPrev },
            timestamp: new Date().toISOString(),
          };
        }
        return { success: true, message, data, timestamp: new Date().toISOString() };
      }),
    );
  }
}
