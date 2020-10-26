import { Response, Router } from 'express';
import { IUserRequest } from '../../interfaces/IUserRequest';
import { Container } from 'typedi';
import LoggerInstance from '../../loaders/logger';
import CityService from '../../services/city';
import { celebrate, Joi } from 'celebrate';
import TypeSortCity from '../../models/enum/typeSortCity';

const route = Router();

export default (app: Router): void => {
  app.use('/city', route);

  route.get(
    '/list',
    celebrate({
      query: Joi.object({
        country: Joi.string().required(),
        sort: Joi.string()
          .required()
          .valid(...Object.values(TypeSortCity)),
      }),
    }),
    async (req: IUserRequest, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      const cityService = Container.get(CityService);
      try {
        const countryString = String(req.query.country);
        const sortType = TypeSortCity[String(req.query.sort)];
        const result = await cityService.findByCountryAndSort(countryString, sortType);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );

  route.get(
    '/detail',
    celebrate({
      query: Joi.object({
        country: Joi.string().required(),
        city: Joi.string().required(),
      }),
    }),
    async (req: IUserRequest, res: Response, next) => {
      const logger = Container.get<typeof LoggerInstance>('logger');
      const cityService = Container.get(CityService);
      try {
        const countryName = String(req.query.country);
        const cityName = String(req.query.city);
        const result = await cityService.getDetailByCountryAndName(countryName, cityName);
        return res.json(result).status(200);
      } catch (err) {
        logger.error('🔥 error: %o', err);
        return next(err);
      }
    },
  );
};
