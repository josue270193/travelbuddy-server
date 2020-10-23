import { ICity } from '../interfaces/ICity';
import mongoose from 'mongoose';

const City = new mongoose.Schema(
  {
    city: {
      name: {
        type: String,
        index: true,
        unique: true,
        required: [true, 'Ingrese el nombre de la ciudad'],
      },
      wiki: {
        type: Object,
      },
    },
    country: {
      name: {
        type: String,
        required: [true, 'Ingrese el nombre del pais'],
      },
      wiki: {
        type: Object,
      },
    },
    reviews: {
      type: Array,
    },
    questions: {
      type: Array,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ICity & mongoose.Document>('City', City);
