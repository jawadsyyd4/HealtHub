import express from "express";
import upload from "../middlewares/multer.js";
import {
  addSpeciality,
  getSpecialities,
  deleteSpeciality,
  updateSpeciality,
  getSpecialityById,
} from "../controllers/specialityController.js";
import authAdmin from "../middlewares/authAdmin.js";

const specialityRouter = express.Router();

specialityRouter.post(
  "/add-speciality",
  authAdmin,
  upload.single("image"),
  addSpeciality
);
specialityRouter.get("/specialities", getSpecialities);
specialityRouter.post("/delete-speciality", authAdmin, deleteSpeciality);
specialityRouter.post(
  "/update-speciality",
  upload.single("image"),
  authAdmin,
  updateSpeciality
);

specialityRouter.get("/get-speciality", getSpecialityById);

export default specialityRouter;
