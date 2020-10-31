import { Inject, Service } from 'typedi';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import CityModel from '../models/city';
import CityRankingModel from '../models/cityRanking';
import CityEntityModel from '../models/cityEntity';
import TypeSortCity from '../models/enum/typeSortCity';
import _ from 'lodash';
import { ICityRankingDto, ICountryRankingDto } from '../interfaces/dto/ICountryRankingDto';
import { ICityRanking } from '../interfaces/ICityRanking';
import { ICityEntityDto, ICityEntityReviewDto } from '../interfaces/dto/ICityEntityDto';

@Service()
export default class CityService {
  constructor(
    @Inject('logger') private logger,
    @Inject('cityModel') private cityModel: typeof CityModel,
    @Inject('cityRankingModel') private cityRankingModel: typeof CityRankingModel,
    @Inject('cityEntityModel') private cityEntityModel: typeof CityEntityModel,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async findByCountryAndSort(country: string, sortType: TypeSortCity): Promise<ICountryRankingDto> {
    if (country) {
      country = country.toLowerCase();
      switch (sortType) {
        case TypeSortCity.RANKING:
          return this.cityRankingModel
            .find({ 'country.name': new RegExp(country) })
            .then((result) => {
              return result.map((item) => item.toObject());
            })
            .then((result) => {
              return _.groupBy(result, 'country.name');
            })
            .then((result) => {
              return result[country];
            })
            .then((result) => {
              if (result) {
                const countryFound = result.find((item) => item.country.wiki).country;
                return {
                  country: countryFound,
                  cities: result.map((item: ICityRanking) => {
                    const { _id, city, rating_average } = item;
                    return {
                      id: _id,
                      name: city.name,
                      wiki: city.wiki,
                      rating_average,
                    } as ICityRankingDto;
                  }),
                } as ICountryRankingDto;
              } else {
                throw Error(`Error al obtener ciudades de ${country} por RANKING`);
              }
            });
        default:
          throw Error(`Error al obtener ciudades de ${country} por defecto`);
      }
    } else {
      throw Error(`Error al obtener ciudades de ${country}`);
    }
  }

  public async getDetailByCountryAndName(country: string, city: string): Promise<ICityEntityDto[]> {
    if (country && city) {
      country = country.toLowerCase();
      city = city.toLowerCase();
      return this.cityEntityModel
        .find({ '_id.city': new RegExp(city), '_id.country': new RegExp(country) })
        .then((result) => {
          return result.map((item) => item.toObject());
        })
        .then((result) => {
          if (result) {
            return result.map((item) => {
              return {
                country: item._id.country,
                city: item._id.city,
                entity_type: item._id.entity_type,
                score_average: item.score_average,
                entity_value: item.entity_value,
                reviews: item.reviews.map((itemAux) => {
                  return {
                    text: itemAux.text,
                    score: itemAux.score,
                  } as ICityEntityReviewDto;
                }),
              } as ICityEntityDto;
            });
          } else {
            throw Error(`Error al obtener el detalle de la ciudad ${city} en ${country}`);
          }
        });
    } else {
      throw Error(`Error al obtener el detalle de la ciudad ${city} en ${country}`);
    }
  }
}
