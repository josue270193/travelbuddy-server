import { Container } from 'typedi';
import LoggerInstance from './logger';
import agendaFactory from './agenda';

export default ({ mongoConnection, models }: { mongoConnection; models: { name: string; model: any }[] }) => {
  try {
    models.forEach((item) => {
      Container.set(item.name, item.model);
    });

    const agendaInstance = agendaFactory({ mongoConnection });

    Container.set('agendaInstance', agendaInstance);
    Container.set('logger', LoggerInstance);

    LoggerInstance.info('✌️ Agenda injected into container');

    return { agenda: agendaInstance };
  } catch (e) {
    LoggerInstance.error('🔥 Error on dependency injector loader: %o', e);
    throw e;
  }
};
