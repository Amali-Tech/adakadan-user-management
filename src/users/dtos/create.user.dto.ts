

export interface ICreateUserDto {
  email: string;
  firstName: string;
  otherName: string;
  surname: string;
  accountType: string; 
  isActivated: boolean;
  getNewsletter: boolean;
  phone: string;
  profileImage: string
}
