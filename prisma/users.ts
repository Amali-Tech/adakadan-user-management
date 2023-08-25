import bcrypt from 'bcrypt';

const salt = bcrypt.genSaltSync(+process.env.SALT_ROUND!);
const password = bcrypt.hashSync('Pielly16$', salt);

const users = [
  {
    firstName: 'John',
    surname: 'Doe',
    email: 'pielly16@gmail.com',
    accountType: 'Admin',
    password,
    isActivated: true,
  },
];

export default users;
