import mongoose from 'mongoose';
import { IConfiguration } from '../interfaces/IConfiguration';

const Configuration = new mongoose.Schema({
  name: {
    type: String,
  },
  value: {
    type: Array,
  },
});

export default mongoose.model<IConfiguration & mongoose.Document>('Configuration', Configuration);
