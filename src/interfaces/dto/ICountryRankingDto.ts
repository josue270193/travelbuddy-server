import { ICityDetail, ICountryDetail } from '../ICity';

export interface ICountryRankingDto {
  country: ICountryDetail;
  cities: ICityRankingDto[];
}

export interface ICityRankingDto {
  _id: string;
  city: ICityDetail;
  rating_average: number;
}
