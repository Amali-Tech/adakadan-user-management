 
 import bcrypt from "bcrypt";


const salt =  bcrypt.genSaltSync(+(process.env.SALT_ROUND as string));
const password =  bcrypt.hashSync("1994", salt);

 const  users = [
  {
    firstName: 'John',
    surname: 'Doe',
    email: 'doe@example.com',
    role: "Admin",
    password,
    isActivated: true

  }
]

export  default users