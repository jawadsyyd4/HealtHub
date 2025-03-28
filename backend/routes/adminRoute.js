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
} from "../controllers/adminController.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailablity } from "../controllers/doctorController.js";

const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);
adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctor", authAdmin, allDoctors);
adminRouter.post("/change-availability", authAdmin, changeAvailablity);
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

export default adminRouter;
