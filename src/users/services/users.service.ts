import prisma from '../../prisma';
import { CRUD } from '../../common/interfaces/crud.intefaces';
import { ICreateUserDto } from '../dtos/create.user.dto';
import { IPatchUserDto } from '../dtos/patch.user.dto';
import bcrypt from 'bcrypt';
import debug from 'debug';
import { omit } from 'lodash';



const log: debug.IDebugger = debug("app:user-service");
class UsersService implements CRUD {
  async create(resource: ICreateUserDto) {
    const user = await prisma.user.create({ data: resource });
    return user;
  }
  async activateUser( id: string ) {
    const user = await prisma.user.update({
      where: { id: id },
      data: {  isActivated: true },
    });
    return omit(user, ['password']);
  }
  async putById(id: string, resource: Partial<IPatchUserDto>) {
    const user = await prisma.user.update({ where: { id }, data: resource });
    return user;
  }
  async readById(id: string) {
    const user = await prisma.user.findFirst({ where: { id } });
    if(!user) {
      return
    }
    return omit(user, ["password"]);
  }
  async patchById(id: string, resource: Partial<IPatchUserDto>) {
    const user = await prisma.user.update({ where: { id }, data: resource });
    return omit(user, ["password"]);
  }
  async deleteById(id: string) {
    await prisma.user.delete({ where: { id } });
  }
  async list(query:any) {
    const skip = 0
    log(skip)
    const users = await prisma.user.findMany({ take: (+query.limit), skip });
    let usersWithoutPassword : Object[] = [];
    for (const user  of users) {
     usersWithoutPassword.push(omit(user , ["password"])) 
    }
    return usersWithoutPassword;
  }
  async getUserByEmail(email: string) {
    const user = await prisma.user.findFirst({ where: { email } });

    return user;
  }
  async comparePassword(password: string, userPassword: string) {
    const isMatch = await bcrypt.compare(password, userPassword);
    return isMatch;
  }
  async hashPassword(userPassword: string) {
    const salt: string = await bcrypt.genSalt(+process.env.SALT!);
    const password = await bcrypt.hash(userPassword, salt);
    return password;
  }

}

export default new UsersService();
