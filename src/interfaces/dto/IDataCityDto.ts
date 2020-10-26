import { ICityDetail, ICountryDetail } from '../ICity';

export interface IDataCityDto {
  country: ICountryDetail;
  city: ICityDetail;
  comments: IDataCityCommentDto[];
}

export interface IDataCityCommentDto {
  text: string;
  score_sentimental: number;
  score_review: number;
  score_question: number;
  entities: [];
}
