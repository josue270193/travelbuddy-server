export interface ICity {
  _id: string;
  city: ICityDetail;
  country: ICountryDetail;
  reviews: IReview[];
  questions: IQuestion[];
}

export interface IReview {
  text: string;
  score: number;
  entities: IEntity[];
}

export interface IQuestion {
  text: string;
  entities: IEntity[];
}

export interface IEntity {
  type: string;
  value: string;
}

export interface ICityDetail {
  name: string;
  wiki: any;
}

export interface ICountryDetail {
  name: string;
  wiki: any;
}

export interface ICityData {
  country: ICountryDetail;
  city: ICityDetail;
  comments: ICityComment[];
}

export interface ICityComment {
  text: string;
  score_sentimental: number;
  score_review: number;
  score_question: number;
  entities: [];
}

export interface ICityRanking {
  _id: string;
  city: ICityDetail;
  country: ICountryDetail;
  reviews: IReview[];
  rating_average: number;
}

export interface ICountryRankingDto {
  country: ICountryDetail;
  cities: ICityRankingDto[];
}

export interface ICityRankingDto {
  _id: string;
  city: ICityDetail;
  rating_average: number;
}

export interface ICityDetail {
  _id: ICityDetailId;
  entity_value: string[];
  reviews: ICityDetailReview[];
}
export interface ICityDetailId {
  country: string;
  city: string;
  entity_type: string;
}
export interface ICityDetailReview {
  text: string;
  score: number;
}

export interface ICityDetailDto {
  city: string;
  country: string;
  entity_type: string;
  score_average: number;
  entity_value: string[];
  reviews: ICityDetailReviewDto[];
}

export interface ICityDetailReviewDto {
  text: string;
  score: number;
}
