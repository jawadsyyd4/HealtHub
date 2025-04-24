import express from "express";
import upload from "../middlewares/multer.js";
import {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentAdmin,
  appointmentCancel,
  adminDashboard,
  getDoctorById,
  updateDoctorInfo,
  deleteDoctor,
  createGuestPatient,
  updateGuestPatient,
  getAllGuestPatients,
  getGuestPatientById,
  getDoctorsBySpecialty,
  getDoctorAvailability,
  getDayTimeRange,
  createAppointment,
} from "../controllers/adminController.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctor", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);

adminRouter.get("/appointments", authAdmin, appointmentAdmin);

adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel);
adminRouter.get("/dashboard", authAdmin, adminDashboard);
adminRouter.get("/doctor-info/:docId", authAdmin, getDoctorById);
adminRouter.post(
  "/update-doctor/:docId",
  authAdmin,
  upload.single("image"),
  updateDoctorInfo
);

adminRouter.post("/delete-doctor/:doctorId", authAdmin, deleteDoctor);

adminRouter.post("/add-guest", authAdmin, createGuestPatient);
adminRouter.post("/update-guest/:id", authAdmin, updateGuestPatient);
adminRouter.get("/guest-patients", authAdmin, getAllGuestPatients);
adminRouter.get("/guest-patients/:patientId", authAdmin, getGuestPatientById);
adminRouter.post("/doctors-by-specialty", authAdmin, getDoctorsBySpecialty);
adminRouter.post("/doctor-availability", authAdmin, getDoctorAvailability);
adminRouter.post("/doctor-day-time", authAdmin, getDayTimeRange);
adminRouter.post("/create-appointment", authAdmin, createAppointment);
export default adminRouter;
