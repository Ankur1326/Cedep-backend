import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  yearMonth: {
    type: String,
    required: true,
    unique: true,
  },
  registrationNumSequenceValue: {
    type: Number,
    required: true,
    default: 0,
  },
  invoiceSequenceNumValue: {
    type: Number,
    required: true,
    default: 0,
  },
});

export const Counter = mongoose.model("Counter", counterSchema);
