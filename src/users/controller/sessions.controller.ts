import express from 'express';
import sessionsService from '../services/sessions.service';
import jwtUtils from '../../helpers/jwt';
import { AppError, HttpCode } from '../../config/errorHandler';

class SessionsController {
  async createSession(req: express.Request, res: express.Response , next: express.NextFunction) {
    try {
      //validate user password
      const user = await sessionsService.validatePassword(req.body);

      if (!user) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid credentials',
        });
      }
      
      // create session
      const session = await sessionsService.createSession(
        user.id,
        req.headers['user-agent']
      );
      // create an accessToken
      const accessToken = await jwtUtils.signJWT(
        { ...user, session: session.id },
        { expiresIn: process.env.ACCESS_TOKEN_TTL }
      );

      // create an refreshToken
      const refreshToken = await jwtUtils.signJWT(
        { ...user, session: session.id },
        { expiresIn: process.env.REFRESH_TOKEN_TTL }
      );

      return res.send({
        success: false,
        data: user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  }
  async getUserSession(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const userId: string = res.locals.user.id;
      const sessions = await sessionsService.getUserSession({
        userId,
        valid: true,
      });

      return res.send(sessions);
    } catch (err) {
      next(err);
    }
  }
  async deleteUserSession(req: express.Request, res: express.Response) {
    const sessionId: string = res.locals.user.session;

    await sessionsService.updateUserSessions({ sessionId, valid: false });
    return res
      .status(202)
      .send({ success: true, accessToken: null, refreshToken: null });
  }
}

export default new SessionsController();
