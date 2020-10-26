import mongoose from 'mongoose';
import { ICityEntity } from '../interfaces/ICityEntity';

const CityEntity = new mongoose.Schema(
  {
    _id: {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      entity_type: {
        type: String,
      },
    },
    entity_value: {
      type: Array,
    },
    reviews: {
      type: Array,
    },
    score_average: {
      type: Number,
    },
  },
  { collection: 'citiesEntities' },
);

export default mongoose.model<ICityEntity & mongoose.Document>('CityEntity', CityEntity);
