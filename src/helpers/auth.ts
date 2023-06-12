import { Request, Response, NextFunction } from 'express';
import debug from 'debug';

const log: debug.IDebugger = debug('app:users-authorisation');


class Authorise {
  adminOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.role !== 'Admin') {
      res.status(403).send({ success: false, message: 'Not authorised' });
    }
    next();
  };
  staffOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.role !== 'Agent' || 'Owner') {
      res.status(403).send({ success: false, message: 'Not authorised' });
    }
    next();
  };
  VistorsOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.user.role !== 'Tenant') {
      res.status(403).send({ success: false, message: 'Not authorised' });
    }
    next();
  };
}

export default new Authorise
