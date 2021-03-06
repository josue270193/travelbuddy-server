import { Inject, Service } from 'typedi';
import jwt from 'jsonwebtoken';
import config from '../config';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { IUser } from '../interfaces/IUser';
import UserModel from '../models/user';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import events from '../subscribers/events';
import { IUserInputDto } from '../interfaces/dto/IUserInputDto';

@Service()
export default class AuthService {
  constructor(
    @Inject('userModel') private userModel: typeof UserModel,
    @Inject('logger') private logger,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async SignUp(userInputDTO: IUserInputDto): Promise<{ user: IUser; token: string }> {
    try {
      const salt = randomBytes(32);
      this.logger.silly('Hashing contrasena');
      const hashedPassword = await argon2.hash(userInputDTO.password, { salt });
      this.logger.silly('Creando usuario en la BD');
      const userRecord = await this.userModel.create({
        ...userInputDTO,
        salt: salt.toString('hex'),
        password: hashedPassword,
      });
      this.logger.silly('Generando JWT');
      const token = this.generateToken(userRecord);

      if (!userRecord) {
        throw new Error('El usuario no pudo ser creado');
      }
      // this.logger.silly('Sending welcome email');
      // await this.mailer.SendWelcomeEmail(userRecord);
      this.eventDispatcher.dispatch(events.user.signUp, { user: userRecord });

      const user = userRecord.toObject();
      Reflect.deleteProperty(user, 'password');
      Reflect.deleteProperty(user, 'salt');
      return { user, token };
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  public async SignIn(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const userRecord = await this.userModel.findOne({ email });
    if (!userRecord) {
      throw new Error('User not registered');
    }
    /**
     * We use verify from argon2 to prevent 'timing based' attacks
     */
    this.logger.silly('Checking password');
    const validPassword = await argon2.verify(userRecord.password, password);
    if (validPassword) {
      this.logger.silly('Password is valid!');
      this.logger.silly('Generating JWT');
      const token = this.generateToken(userRecord);

      const user = userRecord.toObject();
      Reflect.deleteProperty(user, 'password');
      Reflect.deleteProperty(user, 'salt');
      return { user, token };
    } else {
      throw new Error('Invalid Password');
    }
  }

  private generateToken(user) {
    const today = new Date();
    const exp = new Date(today);
    exp.setDate(today.getDate() + 30);
    this.logger.silly(`Sign JWT for userId: ${user._id}`);
    return jwt.sign(
      {
        _id: user._id, // We are gonna use this in the middleware 'isAuth'
        role: user.role,
        name: user.name,
        exp: exp.getTime() / 1000,
      },
      config.jwtSecret,
    );
  }
}
