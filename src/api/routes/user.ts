import { Response, Router } from 'express';
import middlewares from '../middlewares';
import { IUserRequest } from '../../interfaces/IUserRequest';

const route = Router();

export default (app: Router): void => {
  app.use('/users', route);

  route.get('/me', middlewares.isAuth, middlewares.attachCurrentUser, (req: IUserRequest, res: Response) => {
    return res.json({ user: req.currentUser }).status(200);
  });
};
