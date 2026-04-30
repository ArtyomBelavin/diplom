import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../models/store.models';
import type { RequestWithUser } from './request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
