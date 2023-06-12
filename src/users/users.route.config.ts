import express from 'express';
import { CommonRoutesConfig } from '../common/common.routes.config';
import usersController from './controller/users.controller';
import usersMiddleware from './middleware/users.middleware';
import requireUser from '../helpers/requireUser';
import authorise from '../helpers/auth';
import { body } from 'express-validator';
import sessionsController from './controller/sessions.controller';

export class UsersRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'usersRoutes');
  }

  configureRoutes() {
    this.app.route(`/user`).post(sessionsController.createSession);
    this.app.route(`/user/activate/:token`).get(usersController.activateUser);
    this.app
      .route(`/user/forgot-password`)
      .post(usersController.forgotPassword);
    this.app
      .route(`/user/reset-password/:token`)
      .post(
        body('password')
          .isString()
          .notEmpty()
          .withMessage('Password is required'),
        body('confirmPassword')
          .isString()
          .notEmpty()
          .withMessage('Confirm is required'),
        usersMiddleware.verifyRequestFieldsErrors,
        usersMiddleware.checkConfirmPassword,
        usersController.newPassword
      );
    this.app
      .route(`/users`)
      .post(
        usersMiddleware.checkConfirmPassword,
        body('firstName')
          .isString()
          .notEmpty()
          .withMessage('First name is required'),
        body('otherName').optional().isString(),
        body('surname')
          .isString()
          .notEmpty()
          .withMessage('Surname is required'),
        body('email').isEmail().notEmpty().withMessage('Email is required'),
        body('password')
          .isString()
          .notEmpty()
          .withMessage('Password is required'),
        body('confirmPassword')
          .isString()
          .notEmpty()
          .withMessage('Confirm is required'),
        body('role')
          .isIn(['Admin', 'Owner', 'Agent', 'Tenant'])
          .withMessage(`Role can either be Admin, Owner, Agent and Tenant only`)
          .notEmpty()
          .withMessage('Role is required'),
        usersMiddleware.verifyRequestFieldsErrors,
        usersMiddleware.validateSameEmailDoesntExist,
        usersController.createUser
      );
    this.app.use(usersMiddleware.deserializeUser);
    this.app.use(requireUser);
    this.app
      .route(`/users`)
      .get(authorise.adminOnly, usersController.listUsers);
    this.app.param(`userId`, usersMiddleware.extractUserId);
    this.app
      .route(`/user/:userId`)
      .patch(
        body('firstName').optional().isString(),
        body('otherName').optional().isString(),
        body('surname').optional().isString(),
        body('role').optional()
          .isIn(['Admin', 'Owner', 'Agent', 'Tenant'])
          .withMessage(
            `Role can either be Admin, Owner, Agent and Tenant only`
          ),
        usersMiddleware.verifyRequestFieldsErrors,
        usersController.patch
      )
      .get(usersController.getUserById)
      .delete(sessionsController.deleteUserSession);

    this.app
      .route(`/users/:userId`)
      .all(usersMiddleware.validateUserExists, authorise.adminOnly)
      .get(usersController.getUserById)
      .delete(usersController.removeUser)
      .put(
        usersMiddleware.validateSameEmailBelongToSameUser,
        usersController.put
      )
      .patch(
        usersMiddleware.validateSameEmailBelongToSameUser,
        usersController.patch
      );

    return this.app;
  }
}
