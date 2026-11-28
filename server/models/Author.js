import mongoose from 'mongoose';
import { toJSONOptions } from './toJSON.js';

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required.'],
      trim: true,
      minlength: [1, 'name must be 1 to 100 characters long.'],
      maxlength: [100, 'name must be 1 to 100 characters long.'],
      unique: true,
    },
    born: {
      type: Number,
      validate: {
        validator: (value) =>
          value === undefined ||
          value === null ||
          (Number.isInteger(value) && value >= 1000 && value <= new Date().getFullYear()),
        message: () => `born must be an integer between 1000 and ${new Date().getFullYear()}.`,
      },
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: toJSONOptions,
  }
);

export const Author = mongoose.model('Author', authorSchema);