export interface ICityEntity {
  _id: ICityEntityId;
  entity_value: string[];
  reviews: ICityEntityReview[];
  score_average: number;
}

export interface ICityEntityId {
  country: string;
  city: string;
  entity_type: string;
}

export interface ICityEntityReview {
  text: string;
  score: number;
}
