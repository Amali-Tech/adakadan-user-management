import express from 'express';
import sessionsService from '../services/sessions.service';
import jwtUtils from '../../helpers/jwt';

class SessionsController {
  async createSession(req: express.Request, res: express.Response) {
    //validate user password
    const user = await sessionsService.validatePassword(req.body);

    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: 'Invalid credentials' });
    }
    //create session
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

    return res.send({ success: false, data: user, accessToken, refreshToken });
  }
  async getUserSessions(req: express.Request, res: express.Response) {
    const userId: string = res.locals.user.id;

    const sessions = await sessionsService.getUserSessions({
      userId,
      valid: true,
    });

    return res.send(sessions);
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
