import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IUser } from '../../interfaces/IUser';
import LoggerInstance from '../../loaders/logger';
import { IUserRequest } from '../../interfaces/IUserRequest';
import { NextFunction, Response } from 'express';

/**
 * Attach user to req.currentUser
 * @param {*} req Express req Object
 * @param {*} res  Express res Object
 * @param {*} next  Express next Function
 */
const attachCurrentUser = async (req: IUserRequest, res: Response, next: NextFunction): Promise<unknown> => {
  const Logger = Container.get<typeof LoggerInstance>('logger');
  try {
    const UserModel = Container.get('userModel') as mongoose.Model<IUser & mongoose.Document>;
    const userRecord = await UserModel.findById(req.token._id);
    if (!userRecord) {
      return res.sendStatus(401);
    }
    const currentUser = userRecord.toObject();
    Reflect.deleteProperty(currentUser, 'password');
    Reflect.deleteProperty(currentUser, 'salt');
    req.currentUser = currentUser;
    return next();
  } catch (err) {
    Logger.error('🔥 Error attaching user to req: %o', err);
    return next(err);
  }
};

export default attachCurrentUser;
