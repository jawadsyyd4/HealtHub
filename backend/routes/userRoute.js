import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  confirmAppointment,
  listAppointments,
  cancelAppointment,
  paymentStripepay,
  handlePaymentSuccess,
  verifyUser,
  rateDoctor,
  checkUserRating,
  getDocSlots,
  forgetPassword,
  resetPassword,
  docMate,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.post("/verify-email", verifyUser);

// Route to request a password reset (forget password)
userRoute.post("/forget-password", forgetPassword);

// Route to reset the password
userRoute.post("/reset-password", resetPassword);

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
  res.redirect(`${process.env.CLIENT_URL}/my-appointments`);
});

userRoute.post("/rate-doctor", authUser, rateDoctor);
userRoute.get("/user-rate/:doctorId", authUser, checkUserRating);
userRoute.get("/availble-day/:doctorId", getDocSlots);

userRoute.get("/confirm-appointment/:appointmentId", confirmAppointment);

userRoute.post("/chat", authUser, docMate);

export default userRoute;
