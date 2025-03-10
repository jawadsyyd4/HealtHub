import express from "express";
import {
  doctorsList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  updateDoctorProfile,
  doctorProfile,
  getDoctorRatings,
  getDoctorAverageRating,
  getDoctorSchedule,
  createDoctorSchedule,
  updateDoctorSchedule,
} from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorsList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);

doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);

doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

doctorRouter.get("/info/:doctorId", getDoctorRatings);
doctorRouter.get("/rating/:doctorId", getDoctorAverageRating);

doctorRouter.get("/schedule", authDoctor, getDoctorSchedule);
doctorRouter.post("/schedule", authDoctor, createDoctorSchedule);
doctorRouter.post("/update-schedule", authDoctor, updateDoctorSchedule);

export default doctorRouter;
