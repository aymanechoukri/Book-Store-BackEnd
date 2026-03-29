import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
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
      maxlength: 1000,
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    image: {
      type: String,
      required: true, // نخليوها required حيث غادي يكون upload
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "Image is required",
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Book", bookSchema);
