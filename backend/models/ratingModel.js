import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "doctor",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1, // Minimum rating (e.g., 1 star)
    max: 5, // Maximum rating (e.g., 5 stars)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ratingModel =
  mongoose.models.rating || mongoose.model("rating", ratingSchema);

export default ratingModel;
