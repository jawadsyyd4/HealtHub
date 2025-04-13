import cron from "node-cron";
import nodemailer from "nodemailer";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Change to your email provider if needed
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
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

      await freeDoctorSlot(appt);
      await sendCancellationEmail(appt);

      console.log(`✅ Auto-cancelled appointment ID: ${appt._id}`);
    }
  } catch (error) {
    console.error("❌ Error in appointment cleanup:", error.message);
  }
};

// Step 1: Free the doctor's booked slot
const freeDoctorSlot = async (appt) => {
  const doctor = await doctorModel.findById(appt.doctorId);
  if (!doctor?.slots_booked) return;

  const slotDateStr = appt.slotDate.toString();
  const bookedSlots = doctor.slots_booked[slotDateStr];

  if (!Array.isArray(bookedSlots)) {
    console.warn(`⚠️ No valid slots array for date: ${slotDateStr}`);
    return;
  }

  console.log(`Before removal on ${slotDateStr}:`, bookedSlots);

  const updatedSlots = bookedSlots.filter(
    (time) => time.trim() !== appt.slotTime.trim()
  );

  if (updatedSlots.length === 0) {
    delete doctor.slots_booked[slotDateStr];
  } else {
    doctor.slots_booked[slotDateStr] = updatedSlots;
  }

  doctor.markModified("slots_booked");
  await doctor.save();

  console.log(
    `After removal on ${slotDateStr}:`,
    doctor.slots_booked[slotDateStr]
  );
};

// Step 2: Send cancellation email to the user
const sendCancellationEmail = async (appt) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: appt.userData.email,
    subject: "Appointment Auto-Cancelled",
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            }
            h1 {
              text-align: center;
              color: #f44336;
              font-size: 28px;
            }
            p {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
            }
            .appointment-details {
              background-color: #f4f4f4;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
              font-size: 16px;
            }
            .appointment-details p {
              margin: 5px 0;
            }
            footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #777;
            }
            footer a {
              color: #f44336;
              text-decoration: none;
            }
            footer a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Appointment Cancelled</h1>
            <p>Dear ${appt.userData.name},</p>
            <p>Your appointment has been <strong>automatically cancelled</strong> as it wasn't confirmed before the deadline.</p>
            <div class="appointment-details">
              <p><strong>Date:</strong> ${appt.slotDate.replace(/_/g, "/")}</p>
              <p><strong>Time:</strong> ${appt.slotTime}</p>
              <p><strong>Doctor:</strong> Dr. ${appt.doctorData.name}</p>
            </div>
            <p>You can book a new appointment anytime from your dashboard.</p>
            <footer>
              <p>If you have any questions, please contact our support team.</p>
              <p>Thank you,<br/>The HealthCare Team</p>
            </footer>
          </div>
        </body>
      </html>
    `,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error(
        `❌ Error sending email to ${appt.userData.email}:`,
        err.message
      );
    } else {
      console.log(`📧 Cancellation email sent to ${appt.userData.email}`);
    }
  });
};

// 🕒 Schedule the job to run every 30 minutes
cron.schedule("*/30 * * * *", cancelExpiredAppointments);

export default cancelExpiredAppointments;
