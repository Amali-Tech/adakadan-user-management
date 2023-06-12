import express from 'express';
import usersService from '../services/users.service';
import debug from 'debug';
import jwt, { JwtPayload } from 'jsonwebtoken';
import template from '../../helpers/template';
import sendMail from '../../helpers/mail';

const log: debug.IDebugger = debug('app:users-controller');

class UserController {
  async listUsers(req: express.Request, res: express.Response) {
    const users = await usersService.list(req.query);
     res.status(200).send({ success: true, data: users });
  }
  async getUserById(req: express.Request, res: express.Response) {
    const user = await usersService.readById(req.body.id);
    res.status(200).send({ success: true, data: user });
  }
  async createUser(req: express.Request, res: express.Response) {
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
            `${process.env.USER_URL}/activate/${emailToken}`
          );
          sendMail([user.email], template.activateSubject, activateUserMail);
        }
      );
      res.status(201).send({
        success: true,
        data: `Please activate your account with the link sent ${user.email}`,
      });
    } catch (err: any) {
      res.status(500).send({
        success: false,
        mesage: 'Erorr creating user account',
        err: err.message,
      });
    }
  }

  async activateUser(req: express.Request, res: express.Response) {
   try{ const { id } = jwt.verify(
      req.params.token,
      process.env.MAIL_TOKEN
    ) as JwtPayload;

    const user = await usersService.activateUser(id);
   return res.status(201).send({ success: true, data: user });}catch(err){
    res.status(400).send({success:false, message: "Error activating account", error: err.message});
   }
  }
  async newPassword(req: express.Request, res: express.Response) {
      // Get the token through request body or params
    try{const { id } = jwt.verify(
      req.params.token,
      process.env.MAIL_TOKEN
    ) as JwtPayload;

    let user = await usersService.readById(id);
    if (!user) {
      res.status(400).send({ success: false, message: 'User not found' });
    }
    const password = await usersService.hashPassword(req.body.password);
    await usersService.patchById(user.id, { password: password });
    res
      .status(201)
      .send({ success: true, message: 'Password reset successful' })}catch (err){
        res.status(400).send({ success: false, message: "Password reset failed", err: err.message });
      };
  }
  async patch(req: express.Request, res: express.Response) {
    const { firstName, surname, otherName, phone, role } = req.body;
    if (res.locals.role !== 'Admin' && role === 'Admin')
      return res.status(403).send({ success: false, message: 'Unauthorised' });
    const user = await usersService.patchById(req.body.id, {
      firstName,
      surname,
      otherName,
      phone,
      role,
    });
    res.status(201).send({ success: true, data: user });
  }
  async put(req: express.Request, res: express.Response) {
    log(await usersService.putById(req.body.id, req.body));
    res.status(204).send();
  }
  async removeUser(req: express.Request, res: express.Response) {
    log(await usersService.deleteById(req.body.id));
    res.status(204).send();
  }
  async forgotPassword(req: express.Request, res: express.Response) {
    const user = await usersService.getUserByEmail(req.body.email);
    if (!user) {
      return res
        .status(401)
        .send({ success: false, message: 'User email is incorrect.' });
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
  }
}

export default new UserController();
