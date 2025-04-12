import cron from "node-cron";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

dotenv.config();

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Change to your email provider if needed
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const cancelExpiredAppointments = async () => {
  try {
    const now = new Date();

    const expiredAppointments = await appointmentModel.find({
      confirmed: false,
      cancelled: false,
      confirmationDeadline: { $lt: now },
    });

    for (const appt of expiredAppointments) {
      appt.cancelled = true;
      await appt.save();

      // Step 1: Free the doctor's booked slot
      const doctor = await doctorModel.findById(appt.doctorId);
      if (doctor && doctor.slots_booked && doctor.slots_booked[appt.slotDate]) {
        doctor.slots_booked[appt.slotDate] = doctor.slots_booked[
          appt.slotDate
        ].filter((time) => time !== appt.slotTime);

        await doctor.save();
      }

      // Step 2: Send cancellation email to user
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: appt.userData.email,
        subject: "Appointment Auto-Cancelled",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #f44336;">Appointment Cancelled</h2>
            <p>Dear ${appt.userData.name},</p>
            <p>Your appointment with Dr. ${appt.doctorData.name} on 
              <strong>${appt.slotDate.replace(/_/g, "/")}</strong> at 
              <strong>${appt.slotTime}</strong> has been 
              <strong>automatically cancelled</strong> because it was not confirmed before the deadline.</p>
            <p>You can book a new appointment any time from your dashboard.</p>
            <p style="margin-top: 20px;">Thank you,<br/>The HealthCare Team</p>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error(
            `Error sending cancellation email to ${appt.userData.email}:`,
            err.message
          );
        } else {
          console.log(`Cancellation email sent to ${appt.userData.email}`);
        }
      });

      console.log(`Auto-cancelled appointment ID: ${appt._id}`);
    }
  } catch (error) {
    console.error("Error in appointment cleanup:", error.message);
  }
};

// 🕒 Schedule the job to run every 30 minutes
cron.schedule("*/30 * * * *", cancelExpiredAppointments);

export default cancelExpiredAppointments;
