import cron from "node-cron";
import doctorModel from "../models/doctorModel.js";
import DoctorSchedule from "../models/DoctorScheduleModel.js";

// 🔁 Core logic to reactivate unavailable doctors
const reactivateUnavailableDoctors = async () => {
  try {
    const now = new Date();

    const schedules = await DoctorSchedule.find({
      unavailableTo: { $lte: now },
    });

    for (const schedule of schedules) {
      const doctorId = schedule.doctor;

      const doctor = await doctorModel.findById(doctorId);
      if (doctor && doctor.available === false) {
        await doctorModel.findByIdAndUpdate(doctorId, { available: true });
        await DoctorSchedule.findOneAndUpdate(
          { doctor: doctorId },
          { unavailableTo: null }
        );

        console.log(`[CRON] ✅ Doctor ${doctor.name} reactivated.`);
      }
    }
  } catch (error) {
    console.error("[CRON] ❌ Error reactivating doctors:", error.message);
  }
};

// 🕒 Schedule the job to run every 30 minutes
cron.schedule("*/30 * * * *", reactivateUnavailableDoctors);

// Export the function (optional)
export default reactivateUnavailableDoctors;
