import * as bcrypt from 'bcrypt';

const password =  bcrypt.hashSync("Pielly16$", +process.env.SALT_ROUND!)

const users = [
  {
    firstName: 'John',
    surname: 'Doe',
    email: 'pielly16@gmail.com',
    accountType: 'Admin',
    password ,
    isActivated: true,
  },
];

export default users;
