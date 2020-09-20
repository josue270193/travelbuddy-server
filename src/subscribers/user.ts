import { Container } from 'typedi';
import { EventSubscriber, On } from 'event-dispatch';
import events from './events';
import { IUser } from '../interfaces/IUser';
import mongoose from 'mongoose';
import LoggerInstance from '../loaders/logger';

@EventSubscriber()
export default class UserSubscriber {
  @On(events.user.signIn)
  public onUserSignIn({ _id }: Partial<IUser>) {
    const Logger = Container.get<typeof LoggerInstance>('logger');
    try {
      const UserModel = Container.get('UserModel') as mongoose.Model<IUser & mongoose.Document>;
      UserModel.update({ _id }, { $set: { lastLogin: new Date() } });
    } catch (err) {
      Logger.error(`🔥 Error on event ${events.user.signIn}: %o`, err);
      throw err;
    }
  }

  @On(events.user.signUp)
  public onUserSignUp() {
    const Logger = Container.get<typeof LoggerInstance>('logger');
    try {
      Logger.debug(`Event onUserSignUp OK`);
    } catch (err) {
      Logger.error(`🔥 Error on event ${events.user.signUp}: %o`, err);
      throw err;
    }
  }
}
