export interface ICity {
  _id: string;
  city: ICityDetail;
  country: ICountryDetail;
  reviews: IReview[];
  questions: IQuestion[];
}

export interface ICityDetail {
  name: string;
  wiki: any;
}

export interface ICountryDetail {
  name: string;
  wiki: any;
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
