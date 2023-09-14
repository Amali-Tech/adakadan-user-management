import prisma from '../../../prisma';
import { CRUD } from '../../../common/interfaces/crud.intefaces';
import { ICreateUserDto } from '../dtos/create.user.dto';
import { IPatchUserDto } from '../dtos/patch.user.dto';
import * as bcrypt from 'bcrypt';
import debug from 'debug';
import { omit } from 'lodash';
import { User } from '@prisma/client';
import { AppError, HttpCode } from '../../../config/errorHandler';

const log: debug.IDebugger = debug('app:user-service');
class UsersService implements CRUD {
  async create(resource: ICreateUserDto) {
    try {
      const date = new Date(Date.now());
      await prisma.user.deleteMany({
        where: { AND: { isActivated: false, createdAt: { lt: date } } },
      });
      return await prisma.user.create({ data: resource });
    } catch (err) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles creating user',
        isOperational: false,
      });
    }
  }
  async activateUser(id: string, resource: Partial<IPatchUserDto>) {
    try {
      const user = await this.patchById(id, resource);

      if (!user) {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid link, please register',
        });
      }
      return omit(user, [
        'password',
        'createdAt',
        'updatedAt',
        'isActivated',
        'getNewsLetters',
      ]);
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles activating user',
        isOperational: false,
      });
    }
  }
  async readById(id: string) {
    try {
      const user = await prisma.user.findFirst({ where: { id } });
      if (!user) {
        return;
      }
      return omit(user, [
        'password',
        'createdAt',
        'updatedAt',
        'isActivated',
        'getNewsLetters',
      ]);
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles getting user',
        isOperational: false,
      });
    }
  }
  async patchById(id: string, resource: Partial<IPatchUserDto>) {
    try {
      const user = await prisma.user.update({ where: { id }, data: resource });
      return omit(user, [
        'password',
        'createdAt',
        'updatedAt',
        'isActivated',
        'getNewsLetters',
      ]);
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles updating user',
        isOperational: false,
      });
    }
  }
  async deleteById(id: string) {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles deleting user',
        isOperational: false,
      });
    }
  }
  async list(query?: Record<string, string | boolean>) {
    try {
      let users: User[];
      if (query) {
        const page = query.page ? +query.page - 1 : 0;
        const skip = +query.limit * page;
        log(skip);
        users = await prisma.user.findMany({ take: +query.limit, skip });
      } else {
        users = await prisma.user.findMany();
      }
      let usersWithoutPassword: Record<string, unknown>[] = [];
      for (const user of users) {
        usersWithoutPassword.push(omit(user, ['password', 'isActivated']));
      }
      return usersWithoutPassword;
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles creating users',
        isOperational: false,
      });
    }
  }
  async getUserByEmail(email: string) {
    try {
      return await prisma.user.findFirst({ where: { email } });
    } catch (err) {
      if (err.code == 'P2023') {
        throw new AppError({
          httpCode: HttpCode.BAD_REQUEST,
          description: 'Invalid UUID',
        });
      }
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles getting user',
        isOperational: false,
      });
    }
  }
  async comparePassword(password: string, userPassword: string) {
    try {
      return await bcrypt.compare(password, userPassword);
    } catch (err) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred during log in',
      });
    }
  }
  async hashPassword(userPassword: string) {
    try {
      const salt: string = await bcrypt.genSalt(+process.env.SALT!);
      const password = await bcrypt.hash(userPassword, salt);
      return password;
    } catch (err) {
      throw new AppError({
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        description: 'Error occurred whiles hashing credentials',
        isOperational: false,
      });
    }
  }
}

export default new UsersService();
