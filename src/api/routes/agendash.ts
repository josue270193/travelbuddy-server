import { Router } from 'express';
import basicAuth from 'express-basic-auth';
import agendash from 'agendash';
import { Container } from 'typedi';
import config from '../../config';

export default (app: Router): void => {
  const agendaInstance = Container.get('agendaInstance');

  app.use(
    '/dash',
    basicAuth({
      users: {
        [config.admin.user]: config.admin.password,
      },
      challenge: true,
    }),
    agendash(agendaInstance),
  );
};
