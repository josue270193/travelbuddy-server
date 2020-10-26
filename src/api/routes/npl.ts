import { Request, Response, Router } from 'express';
import { Container } from 'typedi';
import NplService from '../../services/npl';
import LoggerInstance from '../../loaders/logger';
import { celebrate, Joi } from 'celebrate';
import basicAuth from 'express-basic-auth';
import config from '../../config';
import fileUpload from 'express-fileupload';

type UploadedFile = fileUpload.UploadedFile;

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
        const textFile = (req as UploadedFile).files.texts;
        logger.debug(`Archivo a procesar: ${textFile.name}`);
        const result = await nplService.processFile(country, city, textFile);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );
};
