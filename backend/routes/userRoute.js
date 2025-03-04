import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentStripepay,
  handlePaymentSuccess,
  verifyEmail,
  rateDoctor,
  checkUserRating,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.get("/verify-email", verifyEmail);
userRoute.post("/login", loginUser);
userRoute.get("/get-profile", authUser, getProfile);
userRoute.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);
userRoute.post("/book-appointment", authUser, bookAppointment);
userRoute.get("/appointments", authUser, listAppointments);
userRoute.post("/cancel-appointment", authUser, cancelAppointment);

userRoute.post("/payment-stripepay", authUser, paymentStripepay);
userRoute.get("/payment/success", handlePaymentSuccess);

userRoute.get("/payment/cancel", (req, res) => {
  res.redirect("http://localhost:5173/my-appointments");
});

userRoute.post("/rate-doctor", authUser, rateDoctor);
userRoute.get("/user-rate/:doctorId", authUser, checkUserRating);

export default userRoute;
