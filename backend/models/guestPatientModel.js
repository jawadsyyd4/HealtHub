import mongoose from "mongoose";

const guestPatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  gender: { type: String },
  dateOfBirth: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const guestPatientModel =
  mongoose.models.guestPatient ||
  mongoose.model("guestPatient", guestPatientSchema);

export default guestPatientModel;
