import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import jobsLoader from './jobs';
import Logger from './logger';
import './events';

export default async ({ expressApp }) => {
  const mongoConnection = await mongooseLoader();
  Logger.info('✌️ DB loaded and connected!');

  const userModel = {
    name: 'userModel',
    model: require('../models/user').default,
  };
  const cityModel = {
    name: 'cityModel',
    model: require('../models/city').default,
  };
  const cityRankingModel = {
    name: 'cityRankingModel',
    model: require('../models/cityRanking').default,
  };
  const configurationModel = {
    name: 'configurationModel',
    model: require('../models/configuration').default,
  };
  const cityEntityModel = {
    name: 'cityEntityModel',
    model: require('../models/cityEntity').default,
  };

  // It returns the agenda instance because it's needed in the subsequent loaders
  const { agenda } = await dependencyInjectorLoader({
    mongoConnection,
    models: [userModel, cityModel, cityRankingModel, configurationModel, cityEntityModel],
  });
  Logger.info('✌️ Dependency Injector loaded');

  await jobsLoader({ agenda });
  Logger.info('✌️ Jobs loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
