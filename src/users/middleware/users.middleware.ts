import express from 'express';
import userService from '../services/users.service';
import debug from 'debug';
import jwtUtils from '../../helpers/jwt';
import { get } from 'lodash';
import { validationResult } from 'express-validator';
import sessionsService from '../services/sessions.service';

const log: debug.IDebugger = debug('app:users-middleware');
class UsersMiddleware {
  async verifyRequestFieldsErrors(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ success: false, errors: errors.array() });
    }
    next();
  }
  async checkConfirmPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const isMatch = req.body.password === req.body.confirmPassword;
    if (!isMatch) {
      return res.status(400).send({
        success: false,
        message: 'Password and Confirm Password do not match',
      });
    }
    next();
  }

  async validateSameEmailDoesntExist(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await userService.getUserByEmail(req.body.email);
    if (user) {
      res.status(400).send({ error: `User email already exists` });
    } else {
      next();
    }
  }

  async validateSameEmailBelongToSameUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await userService.getUserByEmail(req.body.email);

    if (user && user.id == req.params.userId) {
      next();
    } else {
      res.status(400).send({ error: `Invalid email` });
    }
  }


  async validateUserExists(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {

    const user = await userService.readById(req.params.userId);
    if (user) {
      next();
    } else {
      res.status(404).send({
        error: `User ${req.params.userId} not found`,
      });
    }
  }
  async extractUserId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.body.id = req.params.userId;
    next();
  }

  async deserializeUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const acessToken = get(req, 'headers.authorization', '').replace(
      /^Bearer\s/,
      ''
    );

    const refreshToken: string = get(req, 'headers.x-refresh') as string;

    if (!acessToken) {
     return next();
    }
    const { decoded, expired } = await jwtUtils.verifyJWT(acessToken);
    if (decoded) {
      res.locals.user = decoded;
      return next();
    }
    if (expired && refreshToken) {
      const newAccessToken  = await sessionsService.reIssueAccessToken({
        refreshToken,
      }) ;
      if (newAccessToken) {
        res.setHeader('x-access-token', newAccessToken as string);
      }
      const result = await jwtUtils.verifyJWT(newAccessToken as string);
      res.locals.user = result.decoded;
    }
    return next();
  }
}

export default new UsersMiddleware();
