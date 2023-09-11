

export interface ICreateUserDto {
  email: string;
  firstName: string;
  otherName?: string;
  surname: string;
  accountType: string; 
  getNewsletter: boolean;
  phone?: string;
  profileImage?: string
}
