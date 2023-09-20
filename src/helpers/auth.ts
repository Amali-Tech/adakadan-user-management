import { Request, Response, NextFunction } from 'express';
import debug from 'debug';
import { AppError, HttpCode } from '../config/errorHandler';

const log: debug.IDebugger = debug('app:users-authorisation');

class Authorise {
  adminOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.accountType !== 'Admin') {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'Not authorised',
      });
    }
    next();
  };
  staffOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.accountType !== 'Management') {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'Not authorised',
      });
    }
    next();
  };
  VistorsOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.accountType !== 'Client') {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'Not authorised',
      });
    }
    next();
  };
}

export default new Authorise();
