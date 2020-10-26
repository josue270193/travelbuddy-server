import mongoose from 'mongoose';
import { ICityRanking } from '../interfaces/ICityRanking';

const CityRanking = new mongoose.Schema(
  {
    city: {
      name: {
        type: String,
      },
      wiki: {
        type: Object,
      },
    },
    country: {
      name: {
        type: String,
      },
      wiki: {
        type: Object,
      },
    },
    reviews: {
      type: Array,
    },
    rating_average: {
      type: Number,
    },
  },
  { collection: 'citiesRanking' },
);

export default mongoose.model<ICityRanking & mongoose.Document>('CityRanking', CityRanking);
