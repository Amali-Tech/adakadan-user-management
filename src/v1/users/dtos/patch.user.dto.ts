
export interface IPatchUserDto {
  email: string;
  firstName: string;
  otherName?: string;
  surname: string;
  role: string;
  password: string;
  isActivated: boolean;
  online: boolean;
  getNewsletter: boolean;
  phone: string;
  profileImage:string;
}
