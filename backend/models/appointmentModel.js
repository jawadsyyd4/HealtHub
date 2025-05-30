import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  doctorId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: false },
  guestPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "guestPatient",
    required: false,
  },
  doctorData: { type: Object, required: true },
  amount: { type: Number, required: true },
  date: { type: Number, required: true },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false }, // New field for confirmation
  confirmationDeadline: {
    type: Date,
    required: true,
    default: function () {
      const now = new Date();
      return new Date(now.getTime() + 5 * 60 * 60 * 1000); // Default is 14 hours from now
    },
  }, // Deadline to confirm within 14 hours
});

const appointmentModel =
  mongoose.models.appointment ||
  mongoose.model("appointment", appointmentSchema);

export default appointmentModel;
