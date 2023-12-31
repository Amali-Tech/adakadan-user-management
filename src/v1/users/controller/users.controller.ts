import express from "express";
import usersService from "../services/users.service";
import { v2 as cloudinary } from "cloudinary";
import debug from "debug";
import jwt, { JwtPayload } from "jsonwebtoken";
import template from "../../../helpers/template";
import sendMail from "../../../helpers/mail";
import { AppError, HttpCode } from "../../../config/errorHandler";
import useragent from "useragent";

const log: debug.IDebugger = debug("app:users-controller");

const cloudinaryConfig = cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDINARYCESECRET,
  secure: true,
});

class UserController {
  async listUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const users = await usersService.list();
      res.status(200).send({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
  async getUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await usersService.readById(req.params.userId);
    res.status(200).send({ success: true, data: user });
  }
  async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      req.body.email = req.body.email.toLowerCase().trim();
      const user = await usersService.create(req.body);

      const userAgentString = req.headers["user-agent"];
      const agent = useragent.parse(userAgentString);

      const browser = agent.toAgent();
      const os = agent.os.toString();
      const device = agent.device.toString();

      const date = new Date(Date.now());

      jwt.sign(
        { id: user.id },
        process.env.MAIL_TOKEN,
        { expiresIn: process.env.MAIL_TTL },
        (err, emailToken) => {
          if (err) {
            throw new AppError({
              httpCode: HttpCode.INTERNAL_SERVER_ERROR,
              description: "Error sending account activation email",
              isOperational: false,
            });
          }
          const activateUserMail = template.activate(
            user.firstName,
            `${process.env.USER_URL}/${user.accountType}/activate/${emailToken}`,
            device,
            os,
            browser,
            req.body.location,
            date
          );
          sendMail([user.email], template.activateSubject, activateUserMail);
        }
      );
      res.status(201).send({
        success: true,
        data: `Please activate your account with the link sent to ${user.email}`,
      });
    } catch (err) {
      next(err);
    }
  }

  async activateUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const decoded = jwt.decode(req.body.token) as JwtPayload;
      if (!decoded) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid link, please register",
        });
      }
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTimestamp) {
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: "Expired link, please register again",
        });
      }

      delete req.body.confirmPassword;
      delete req.body.token;
      req.body.isActivated = true;
      req.body.password = await usersService.hashPassword(req.body.password);
      await usersService.activateUser(decoded.id, req.body);
      return res.status(201).send({
        success: true,
        data: "Account successfully activated. Please, sign in",
      });
    } catch (err) {
      next(err);
    }
  }
  async newPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    // Get the token through request body or params
    try {
      const decoded = jwt.decode(req.body.token) as JwtPayload;
      if (!decoded) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid link, try again",
        });
      }
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTimestamp) {
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: "Invalid link, please try again",
        });
      }
      let user = await usersService.readById(decoded.id);
      if (!user) {
        throw new AppError({
          httpCode: HttpCode.NOT_FOUND,
          description: "User not found",
        });
      }
      const password = await usersService.hashPassword(req.body.password);
      await usersService.patchById(user.id, { password: password });
      res
        .status(201)
        .send({ success: true, message: "Password reset successful" });
    } catch (err) {
      next(err);
    }
  }
  async patch(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await usersService.patchById(res.locals.user.id, req.body);
    res.status(201).send({ success: true, data: user });
  }
  async put(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (res.locals.user.accountType !== "Admin") {
        throw new AppError({
          httpCode: HttpCode.UNAUTHORIZED,
          description: "User not authorized",
          isOperational: true,
        });
      }
      log(await usersService.patchById(req.params.userId, req.body));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  async removeUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      log(await usersService.deleteById(req.body.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  async forgotPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await usersService.getUserByEmail(req.body.email);
      if (!user) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "User email is incorrect",
          isOperational: true,
        });
      }

      const userAgentString = req.headers["user-agent"];
      const agent = useragent.parse(userAgentString);

      const browser = agent.toAgent();
      const os = agent.os.toString();
      const device = agent.device.toString();

      const date = new Date(Date.now());

      jwt.sign(
        { id: user.id },
        process.env.MAIL_TOKEN,
        { expiresIn: process.env.MAIL_TTL },
        (err, emailToken) => {
          if (err) {
            throw new AppError({
              httpCode: HttpCode.INTERNAL_SERVER_ERROR,
              description: "Error sending password reset email",
              isOperational: false,
            });
          }
          const forgotUserMail = template.forgotPassword(
            user.firstName,
            `${process.env.USER_URL}/reset-password/${emailToken}`,
            device,
            os,
            browser,
            req.body.location,
            date
          );
          sendMail(
            [user.email],
            template.forgotPasswordSubject,
            forgotUserMail
          );
        }
      );

      return res.status(201).send({
        success: false,
        message: "Reset your password with link sent to your email",
      });
    } catch (err) {
      next(err);
    }
  }

  getCloudinarySignature(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const teMinutesInMilliseconds = 10 * 60 * 1000;
      const timestampInMilliseconds =
        new Date().getTime() + teMinutesInMilliseconds;
      const timestamp = Math.round(timestampInMilliseconds / 1000);

      const signature = cloudinary.utils.api_sign_request(
        { timestamp },
        cloudinaryConfig.api_secret
      );

      res.status(200).send({ timestamp, signature });
    } catch (err) {
      next(err);
    }
  }

  async addProfilePic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const { version, public_id, signature } = req.body;
      const expectedSignature = cloudinary.utils.api_sign_request(
        { version, public_id },
        cloudinaryConfig.api_secret
      );
      if (expectedSignature != signature) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: "Invalid signature",
        });
      }
      const user = await usersService.readById(req.params.userId);
      if (user.profileImage) {
        cloudinary.uploader.destroy(user.profileImage);
      }
      log(
        await usersService.patchById(req.params.userId, {
          profileImage: public_id,
        })
      );

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
  async deleteProfilePic(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await usersService.readById(req.params.userId);
      cloudinary.uploader.destroy(user.profileImage);
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
