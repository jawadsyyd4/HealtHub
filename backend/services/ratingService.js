// services/ratingService.js
import ratingModel from "../models/ratingModel.js";

export const getDoctorAverageRating = async (doctorId) => {
  const ratings = await ratingModel.find({ doctorId });

  if (ratings.length === 0) return 0; // No ratings yet

  const totalRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
  return totalRatings / ratings.length;
};
