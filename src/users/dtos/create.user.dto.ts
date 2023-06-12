

export interface ICreateUserDto {
  email: string;
  firstName: string;
  otherName: string;
  surname: string;
  role: string; 
  isActivated: boolean;
  getNewsletter: boolean;
  phone: string;
}
