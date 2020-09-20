import { Request, Response, Router } from 'express';
import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';
import _ from 'lodash';
import { Container } from 'typedi';
import TripadvisorService from '../../services/tripadvisor';
import LoggerInstance from '../../loaders/logger';

const route = Router();

export default (app: Router): void => {
  app.use('/scrap', route);

  route.get(
    '/tripadvisor',
    celebrate({
      query: Joi.object({
        pages: Joi.number().required(),
      }),
    }),
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      logger.debug('Calling Scrapping Tripadvisor endpoint with query: %o', req.query);
      try {
        const promises = [];
        const tripadvisorService = Container.get(TripadvisorService);
        _.range(Number(req.query.pages)).forEach((value) => promises.push(tripadvisorService.getInformation(value)));
        const result = await Promise.all(promises).then((value) => {
          console.log('getInformation - DONE');
          tripadvisorService.generateFileDataFromJson(value);
          return value;
        });
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );

  route.get(
    '/tripadvisor/post',
    celebrate({
      query: Joi.object({
        url: Joi.string().required(),
      }),
    }),
    middlewares.isAuth,
    middlewares.attachCurrentUser,
    async (req: Request, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      logger.debug('Calling Scrapping Tripadvisor Post endpoint with query: %o', req.query);
      try {
        const tripadvisorServiceInstance = Container.get(TripadvisorService);
        const result = await tripadvisorServiceInstance.getInformationPost(req.query.url);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );
};
