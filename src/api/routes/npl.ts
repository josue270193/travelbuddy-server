import { Request, Response, Router } from 'express';
import { Container } from 'typedi';
import NplService from '../../services/npl';
import LoggerInstance from '../../loaders/logger';
import { celebrate, Joi } from 'celebrate';
import TypeNpl from '../../models/enum/typeNpl';
import basicAuth from 'express-basic-auth';
import config from '../../config';

const route = Router();

export default (app: Router): void => {
  app.use('/npl', route);

  route.post(
    '/process',
    celebrate({
      body: Joi.object({
        country: Joi.string().required(),
        city: Joi.string().required(),
      }),
    }),
    basicAuth({
      users: {
        [config.admin.user]: config.admin.password,
      },
      challenge: true,
    }),
    async (req: Request, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      const nplService = Container.get(NplService);
      try {
        const country = req.body.country;
        const city = req.body.city;
        const textFile = (req as any).files.texts;
        logger.debug(`Archivo a procesar: ${textFile.name}`);
        const result = await nplService.processFile(country, city, textFile);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );

  route.post(
    '/sentimentAnalysis',
    celebrate({
      body: Joi.object({
        type: Joi.string()
          .required()
          .valid(...Object.values(TypeNpl)),
        text: Joi.string().required(),
      }),
    }),
    basicAuth({
      users: {
        [config.admin.user]: config.admin.password,
      },
      challenge: true,
    }),
    async (req: Request, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      logger.debug('Calling NPL sentiment endpoint with body: %o', req.body);
      try {
        const nplService = Container.get(NplService);
        const result = await nplService.sentimentAnalysis(req.body.text, req.body.type);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );

  route.post(
    '/entityRecognition',
    celebrate({
      body: Joi.object({
        type: Joi.string()
          .required()
          .valid(...Object.values(TypeNpl)),
        text: Joi.string().required(),
      }),
    }),
    basicAuth({
      users: {
        [config.admin.user]: config.admin.password,
      },
      challenge: true,
    }),
    async (req: Request, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      logger.debug('Calling NPL recognition endpoint with body: %o', req.body);
      try {
        const nplService = Container.get(NplService);
        const result = await nplService.entityRecognition(req.body.text, req.body.type);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );
};
