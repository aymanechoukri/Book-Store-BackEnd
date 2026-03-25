import mongoose from "mongoose";

const bookSheme = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "General",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Book", bookSheme);
