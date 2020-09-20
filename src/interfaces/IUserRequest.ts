import { Request } from 'express';
import { IUser } from './IUser';

export interface IUserRequest extends Request {
  token: any;
  currentUser: IUser;
}
