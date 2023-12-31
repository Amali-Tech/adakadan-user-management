import { body } from 'express-validator';
import { CommonRoutesConfig } from '../../common/common.routes.config';
import sessionsController from './controller/sessions.controller';
import express from 'express';
import usersMiddleware from './middleware/users.middleware';

export class SessionsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'sessionsRoutes');
  }
  configureRoutes() {
    this.app
      .route(`${this.versions.v1}/session`)
      .post(
        body('email').isEmail().notEmpty().withMessage('Email is required'),
        body('password')
          .isString()
          .notEmpty()
          .withMessage('Password is required'),
        usersMiddleware.verifyRequestFieldsErrors,
        sessionsController.createSession
      )
      .get(usersMiddleware.deserializeUser,sessionsController.getUserSession)
      .delete(usersMiddleware.deserializeUser,sessionsController.deleteUserSession);
    return this.app;
  }
}
