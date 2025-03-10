import mongoose from "mongoose";

const doctorScheduleSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "doctor",
    required: true,
  },
  availableDays: {
    type: [String],
    required: true,
  },
  availableTimes: {
    type: Map,
    of: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    required: true,
  },
});

const DoctorSchedule =
  mongoose.models.DoctorSchedule ||
  mongoose.model("DoctorSchedule", doctorScheduleSchema);

export default DoctorSchedule;
