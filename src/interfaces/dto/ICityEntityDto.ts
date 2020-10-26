export interface ICityEntityDto {
  city: string;
  country: string;
  entity_type: string;
  score_average: number;
  entity_value: string[];
  reviews: ICityEntityReviewDto[];
}

export interface ICityEntityReviewDto {
  text: string;
  score: number;
}
