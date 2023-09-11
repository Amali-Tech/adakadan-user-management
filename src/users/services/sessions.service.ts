import { omit, get } from 'lodash';
import prisma from '../../prisma';
import usersService from './users.service';
import jwtUtils from '../../helpers/jwt';

class SessionsService {
  async createSession(userId: string, userAgent: string) {
    return prisma.session.create({
      data: { userId: userId, userAgent: userAgent },
    });
  }
  async getUserSession({ userId, valid }: { userId: string; valid: boolean }) {
    return prisma.session.findFirst({
      where: { AND: [{ valid }, { userId }] },
    });
  }
  async updateUserSessions({
    sessionId,
    valid,
  }: {
    sessionId: string;
    valid: boolean;
  }) {
    return prisma.session.update({
      data: { valid },
      where: { id: sessionId },
    });
  }
  async reIssueAccessToken({
    refreshToken,
  }: {
    refreshToken: string;
  }): Promise<boolean | string> {
    const { decoded } = await jwtUtils.verifyJWT(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decoded || !get(decoded, 'session')) return false;

    const session = await prisma.session.findFirst({
      where: { id: get(decoded, 'session') },
      include: { user: true },
    });

    if (!session?.user) return false;

    const accessToken = await jwtUtils.signJWT(
      { ...session.user, session: session.id },
      { expiresIn: process.env.ACCESS_TOKEN_TTL }
    );
    return accessToken;
  }

  async validatePassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    const user = await usersService.getUserByEmail(email.toLowerCase().trim());
    if (!user || !user.isActivated) {
      return false;
    }
    const isValid = await usersService.comparePassword(password, user.password);
    if (!isValid) return false;
    return omit(user, ['password', "isActivated"]);
  }
}

export default new SessionsService();
