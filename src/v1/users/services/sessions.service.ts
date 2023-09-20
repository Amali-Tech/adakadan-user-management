import { omit, get } from "lodash";
import prisma from "../../../prisma";
import usersService from "./users.service";
import jwtUtils from "../../../helpers/jwt";
import { AppError, HttpCode } from "../../../config/errorHandler";
import { User } from "@prisma/client";

class SessionsService {
  async createSession(userId: string, userAgent: string) {
    try {
      return await prisma.session.create({
        data: { userId: userId, userAgent: userAgent },
      });
    } catch (err) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "Error occurred whiles creating session",
      });
    }
  }
  async getUserSession({ userId, valid }: { userId: string; valid: boolean }) {
    try {
      return await prisma.session.findFirst({
        where: { AND: [{ valid }, { userId }] },
      });
    } catch (err) {
      if (err.code == "P2023") {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid UUID",
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "Error occurred during log in",
      });
    }
  }
  async updateUserSessions({
    sessionId,
    valid,
  }: {
    sessionId: string;
    valid: boolean;
  }) {
    try {
      const session = await prisma.session.update({
        data: { valid },
        where: { id: sessionId },
        include: { user: true },
      });
      await usersService.patchById(session.user.id, { online: false });
    } catch (err) {
      if (err.code == "P2023") {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid UUID",
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "Error occurred during log in",
      });
    }
  }
  async reIssueAccessToken({
    refreshToken,
  }: {
    refreshToken: string;
  }): Promise<boolean | string> {
    try {
      const { decoded } = await jwtUtils.verifyJWT(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      if (!decoded || !get(decoded, "session")) return false;

      const session = await prisma.session.findFirst({
        where: { id: get(decoded, "session") },
        include: { user: true },
      });

      if (!session?.user) return false;

      const accessToken = await jwtUtils.signJWT(
        { ...session.user, session: session.id },
        { expiresIn: process.env.ACCESS_TOKEN_TTL }
      );
      return accessToken;
    } catch (err) {
      if (err.code == "P2023") {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid UUID",
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "Error occurred during acess token reissurance",
      });
    }
  }

  async validatePassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    try {
      const user = await usersService.getUserByEmail(
        email.toLowerCase().trim()
      );
      if (!user || !user.isActivated) {
        return false;
      }
      const isValid = await usersService.comparePassword(
        password,
        user.password
      );
      if (!isValid) return false;
      const onlineUser = await usersService.patchById(user.id, {
        online: true,
      });
      return omit(onlineUser, [
        "password",
        "isActivated",
        "createdAt",
        "updatedAt",
        "getNewsletters",
      ]) as User;
    } catch (err) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: "Error occurred during log in",
      });
    }
  }
}

export default new SessionsService();
