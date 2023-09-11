import express from 'express';
import usersService from '../services/users.service';
import { v2 as cloudinary } from 'cloudinary';
import debug from 'debug';
import jwt, { JwtPayload } from 'jsonwebtoken';
import template from '../../helpers/template';
import sendMail from '../../helpers/mail';
import { AppError, HttpCode } from '../../config/errorHandler';

const log: debug.IDebugger = debug('app:users-controller');

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
    const users = await usersService.list();
    res.status(200).send({ success: true, data: users });
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
      delete req.body.confirmPassword;
      req.body.password = await usersService.hashPassword(req.body.password);
      req.body.email = req.body.email.toLowerCase().trim();
      const user = await usersService.create(req.body);

      jwt.sign(
        { id: user.id },
        process.env.MAIL_TOKEN,
        { expiresIn: process.env.MAIL_TTL },
        (err, emailToken) => {
          const activateUserMail = template.activate(
            user.firstName,
            `${process.env.USER_URL}/${user.accountType}/activate/${emailToken}`
          );
          sendMail([user.email], template.activateSubject, activateUserMail);
        }
      );
      res.status(201).send({
        success: true,
        data: `Please activate your account with the link sent to ${user.email}`,
      });
    } catch (err: any) {
      next(err);
    }
  }

  async activateUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const { id } = jwt.verify(
        req.params.token,
        process.env.MAIL_TOKEN
      ) as JwtPayload;

      const user = await usersService.activateUser(id);
      return res.status(201).send({ success: true, data: user });
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
      const { id } = jwt.verify(
        req.params.token,
        process.env.MAIL_TOKEN
      ) as JwtPayload;

      let user = await usersService.readById(id);
      if (!user) {
        throw new AppError({
          httpCode: HttpCode.NOT_FOUND,
          description: 'User not found',
          isOperational: true,
        });
      }
      const password = await usersService.hashPassword(req.body.password);
      await usersService.patchById(user.id, { password: password });
      res
        .status(201)
        .send({ success: true, message: 'Password reset successful' });
    } catch (err) {
      next(err);
    }
  }
  async patch(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (res.locals.role !== 'Admin') {
      throw new AppError({
        httpCode: HttpCode.UNAUTHORIZED,
        description: 'User not authorized',
        isOperational: true,
      });
    }
    const user = await usersService.patchById(res.locals.userId, req.body);
    res.status(201).send({ success: true, data: user });
  }
  async put(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    log(await usersService.patchById(req.params.userId, req.body));
    res.status(204).send();
  }
  async removeUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    log(await usersService.deleteById(req.body.id));
    res.status(204).send();
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
          description: 'User email is incorrect',
          isOperational: true,
        });
      }
      jwt.sign(
        { id: user.id },
        process.env.MAIL_TOKEN,
        { expiresIn: process.env.MAIL_TTL },
        (err, emailToken) => {
          const activateUserMail = template.forgotPassword(
            user.firstName,
            `${process.env.USER_URL}/reset-password/${emailToken}`
          );
          sendMail(
            [user.email],
            template.forgotPasswordSubject,
            activateUserMail
          );
        }
      );

      return res.status(201).send({
        success: false,
        message: 'Reset your password with link sent to your email',
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
          description: 'Invalid signature',
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
