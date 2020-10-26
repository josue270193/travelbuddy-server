import { ICityDetail, ICountryDetail, IReview } from './ICity';

export interface ICityRanking {
  _id: string;
  country: ICountryDetail;
  city: ICityDetail;
  reviews: IReview[];
  rating_average: number;
}
