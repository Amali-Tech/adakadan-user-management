import express from 'express';
import { CommonRoutesConfig } from '../../common/common.routes.config';
import usersController from './controller/users.controller';
import usersMiddleware from './middleware/users.middleware';
import authorise from '../../helpers/auth';
import { body } from 'express-validator';

export class UsersRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'usersRoutes');
  }

  configureRoutes() {
    this.app.route(`${this.versions.v1}/user/activate`).post(
      body('token')
        .notEmpty()
        .withMessage('Token is required')
        .isString()
        .withMessage('Token must be a string'),
      body('password')
        .isString()
        .notEmpty()
        .withMessage('Password is required'),
      body('confirmPassword')
        .custom((value, { req }) => {
          return value == req.body.passwor;
        })
        .withMessage('Passwords is must be the same')
        .isString()
        .notEmpty()
        .withMessage('Confirm password is required'),
      usersController.activateUser
    );
    this.app
      .route(`${this.versions.v1}/user/forgot-password`)
      .post(body('email').isEmail().notEmpty().withMessage('Email is required'),usersMiddleware.verifyRequestFieldsErrors,usersController.forgotPassword);
    this.app.route(`/user/reset-password/:token`).post(
      body('password')
        .isString()
        .notEmpty()
        .withMessage('Password is required'),
      body('confirmPassword')
        .custom((value, { req }) => {
          return value == req.body.passwor;
        })
        .withMessage('Passwords is must be the same')
        .isString()
        .notEmpty()
        .withMessage('Confirm is required'),
      usersMiddleware.verifyRequestFieldsErrors,
      usersController.newPassword
    );
    this.app
      .route(`${this.versions.v1}/users`)
      .post(
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
        body('accountType')
          .isIn(['Client', 'Management'])
          .withMessage(`AccountType can either be Client or Management`)
          .notEmpty()
          .withMessage('AccountType is required'),
        usersMiddleware.verifyRequestFieldsErrors,
        usersMiddleware.validateSameEmailDoesntExist,
        usersController.createUser
      );
    this.app.use('/users', usersMiddleware.deserializeUser);
    this.app.use('/users', usersMiddleware.requireUser);
    this.app
      .route(`${this.versions.v1}/users`)
      .get(authorise.adminOnly, usersController.listUsers);
    this.app
      .route(`${this.versions.v1}/users/:userId`)
      .patch(
        body('firstName').optional().isString(),
        body('otherName').optional().isString(),
        body('surname').optional().isString(),
        body('AccountType')
          .optional()
          .isIn(['Management', 'Client'])
          .withMessage(
            `Account can either be Management, Agent and Client only`
          ),
        usersMiddleware.verifyRequestFieldsErrors,
        usersController.patch
      )
      .get(usersController.getUserById);
    this.app
      .route(`${this.versions.v1}/users/:userId`)
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
    this.app
      .route(`${this.versions.v1}/users/:userId/profileImages`)
      .get(usersController.getCloudinarySignature)
      .patch(
        body('version')
          .isString()
          .notEmpty()
          .withMessage('Cloudinary version is required'),
        body('public_id')
          .isString()
          .notEmpty()
          .withMessage('Cloudinary public id is required'),
        body('signature')
          .isString()
          .notEmpty()
          .withMessage('Cloudinary signature is required'),
        usersController.addProfilePic
      )
      .delete(usersController.deleteProfilePic);

    return this.app;
  }
}
