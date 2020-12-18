import { Router } from 'express';
import auth from './routes/auth';
import user from './routes/user';
import agendash from './routes/agendash';
import tripadvisor from './routes/tripadvisor';
import npl from './routes/npl';
import city from './routes/city';

// guaranteed to get dependencies
export default (): Router => {
  const app = Router();
  auth(app);
  user(app);
  agendash(app);
  tripadvisor(app);
  npl(app);
  city(app);
  return app;
};
