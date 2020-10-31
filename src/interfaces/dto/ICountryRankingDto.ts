import { ICountryDetail } from '../ICity';

export interface ICountryRankingDto {
  country: ICountryDetail;
  cities: ICityRankingDto[];
}

export interface ICityRankingDto {
  id: string;
  name: string;
  wiki: any;
  rating_average: number;
}
