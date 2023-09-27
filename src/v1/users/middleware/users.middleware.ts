import express from 'express';
import userService from '../services/users.service';
import debug from 'debug';
import jwtUtils from '../../../helpers/jwt';
import { get } from 'lodash';
import { validationResult } from 'express-validator';
import sessionsService from '../services/sessions.service';
import { AppError, HttpCode } from '../../../config/errorHandler';

const log: debug.IDebugger = debug('app:users-middleware');
class UsersMiddleware {
  async verifyRequestFieldsErrors(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // throw new AppError({httpCode:HttpCode.BAD_REQUEST, description:errors.array().toString()});
        return res.status(400).send({ success: false, errors: errors.array() });
      }
      next();
    } catch (err) {
      next(err);
    }
  }

  async validateSameEmailDoesntExist(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await userService.getUserByEmail(req.body.email);
      if (user) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'User email already exist',
          isOperational: true,
        });
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  }
  async validateSameEmailBelongToSameUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await userService.getUserByEmail(req.body.email);

      if (user && user.id == req.params.userId) {
        next();
      } else {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid email',
          isOperational: true,
        });
      }
    } catch (err) {
      next(err);
    }
  }

  async validateUserExists(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await userService.readById(req.params.userId);
      if (user) {
        return next();
      }
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: `User ${req.params.userId} not found`,
        isOperational: true,
      });
    } catch (err) {
      next(err);
    }
  }
  async requireUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = res.locals.user;
      if (!user) {
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: 'Please login',
          isOperational: true,
        });
      }
      return next();
    } catch (err) {
      next(err);
    }
  }
  async deserializeUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const acessToken = get(req, 'headers.authorization', '').replace(
        /^Bearer\s/,
        ''
      );
      const refreshToken: string = get(req, 'headers.x-refresh') as string;

      if (!acessToken) {
        return next();
      }
      const { decoded, expired } = await jwtUtils.verifyJWT(
        acessToken,
        process.env.ACCESS_TOKEN_SECRET
      );
      if (decoded) {
        res.locals.user = decoded;
        return next();
      }
      if (expired && refreshToken) {
        const newAccessToken = await sessionsService.reIssueAccessToken({
          refreshToken,
        });
        if (newAccessToken) {
          res.setHeader('x-access-token', newAccessToken as string);
        }
        const result = await jwtUtils.verifyJWT(
          newAccessToken as string,
          process.env.ACCESS_TOKEN_SECRET
        );
        res.locals.user = result.decoded;
      }
      return next();
    } catch (err) {
      next(err);
    }
  }
}

export default new UsersMiddleware();
