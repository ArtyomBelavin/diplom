import type { Request } from 'express';
import type { JwtPayload } from '../models/store.models';

export interface RequestWithUser extends Request {
  user?: JwtPayload;
}
