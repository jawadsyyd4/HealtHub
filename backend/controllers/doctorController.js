import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import ratingModel from "../models/ratingModel.js";
import DoctorSchedule from "../models/DoctorScheduleModel.js";
import nodemailer from "nodemailer";

const doctorsList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);

      res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentsDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const appointments = await appointmentModel.find({ doctorId });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentComplete = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.doctorId === doctorId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      return res.json({ success: true, message: "Appointment Completed." });
    } else {
      return res.json({ success: false, message: "Mark Failed." });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  try {
    const { doctorId, appointmentId } = req.body;

    // Step 1: Find the appointment data by appointmentId
    const appointmentData = await appointmentModel.findById(appointmentId);

    // If the appointment does not exist, send an error response
    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found." });
    }

    // Step 2: Check if the appointment's doctorId matches the provided doctorId
    if (appointmentData.doctorId.toString() !== doctorId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to cancel this appointment.",
      });
    }

    // Step 3: Mark the appointment as cancelled
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // Step 4: Get the doctor's data to update their slots
    const doctorData = await doctorModel.findById(doctorId);

    // If the doctor does not exist, send an error response
    if (!doctorData) {
      return res.json({ success: false, message: "Doctor not found." });
    }

    // Step 5: Remove the slotDate from the doctor's slots_booked
    const { slotDate, slotTime } = appointmentData;

    // Check if the slotDate exists in the doctor's slots_booked
    if (doctorData.slots_booked[slotDate]) {
      // Filter out the canceled slotTime from the array for that date
      doctorData.slots_booked[slotDate] = doctorData.slots_booked[
        slotDate
      ].filter((time) => time !== slotTime);

      // If no slots remain for this slotDate, remove the date from slots_booked
      if (doctorData.slots_booked[slotDate].length === 0) {
        delete doctorData.slots_booked[slotDate];
      }

      // Step 6: Save the updated slots_booked to the doctor model
      await doctorModel.findByIdAndUpdate(doctorId, {
        slots_booked: doctorData.slots_booked,
      });

      // Step 7: Send success response
      return res.json({
        success: true,
        message: "Appointment cancelled and slot freed.",
      });
    }

    // If no slot exists for this date
    return res.json({
      success: false,
      message: "Slot not found for cancellation.",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

const doctorDashboard = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const appointments = await appointmentModel.find({ doctorId });

    let earnings = 0;

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const doctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.body;

    const profileData = await doctorModel
      .findById(doctorId)
      .select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId, fees, address, available } = req.body;

    // Find the doctor data
    const docData = await doctorModel.findById(doctorId);
    if (!docData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // If the availability status is changing, handle the availability change
    if (docData.available !== available) {
      // Update the doctor's availability
      await doctorModel.findByIdAndUpdate(doctorId, { available });

      // If the doctor is unavailable, remove all slots and cancel all future appointments
      if (!available) {
        // Find all future appointments for this doctor that are not cancelled
        const appointments = await appointmentModel.find({
          doctorId,
          cancelled: false,
          slotDate: { $gte: Date.now() }, // Only future appointments
        });

        // Cancel the appointments and remove all slots for each relevant date
        const appointmentUpdates = appointments.map(async (appointment) => {
          // Cancel the appointment
          appointment.cancelled = true;
          appointment.isCompleted = false; // Mark as incomplete
          await appointment.save();

          // Step 4: Remove all time slots for the date of this appointment
          if (docData.slots_booked[appointment.slotDate]) {
            // Remove the entire date from the slots_booked object
            delete docData.slots_booked[appointment.slotDate];
          }

          // Step 5: Update the doctor's slots_booked field in the doctorModel
          await doctorModel.findByIdAndUpdate(doctorId, {
            slots_booked: docData.slots_booked,
          });

          // Send an email notification to the patient with details
          await sendEmailNotification(
            appointment.userData.email,
            docData.speciality,
            appointment.userData.name, // Patient's name
            {
              doctorName: docData.name, // Doctor's name
              slotDate: appointment.slotDate,
              slotTime: appointment.slotTime,
            }
          );
        });

        // Wait for all appointments to be updated, slots to be removed, and emails to be sent
        await Promise.all(appointmentUpdates);
      }
    }

    // Update other doctor details (fees, address)
    await doctorModel.findByIdAndUpdate(doctorId, {
      fees,
      address,
    });

    res.json({
      success: true,
      message: "Doctor profile updated successfully.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorRatings = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const ratings = await ratingModel
      .find({ doctorId })
      .populate("userId", "name"); // Populate userId to get user info

    res.status(200).json(ratings);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getDoctorAverageRating = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const ratings = await ratingModel.find({ doctorId });

    if (ratings.length === 0) {
      return res.status(200).json({ averageRating: 0 }); // No ratings yet
    }

    const totalRatings = ratings.reduce(
      (sum, rating) => sum + rating.rating,
      0
    );
    const averageRating = totalRatings / ratings.length;
    res.json({ success: true, averageRating });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Create Doctor Schedule
const createDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, availableDays, availableTimes } = req.body;

    // Find the doctor
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create a new schedule
    const newSchedule = new DoctorSchedule({
      doctor: doctorId,
      availableDays: availableDays,
      availableTimes: availableTimes,
    });

    // Save the schedule
    await newSchedule.save();
    res.json({
      success: true,
      message: "Doctor schedule created successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getDoctorSchedule = async (req, res) => {
  try {
    // Extract doctorId from the request body
    const { doctorId } = req.body;
    if (!doctorId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    // Find the doctor's schedule by doctorId
    const schedule = await DoctorSchedule.findOne({ doctor: doctorId });

    if (!schedule) {
      return res.json({
        success: false,
        message: "Doctor schedule not found.",
      });
    }

    // Return the schedule data
    res.json({ success: true, schedule });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctorSchedule = async (req, res) => {
  try {
    const { doctorId, availableDays, availableTimes } = req.body;

    // Find the doctor's existing schedule
    const existingSchedule = await DoctorSchedule.findOne({ doctor: doctorId });

    if (!existingSchedule) {
      return res.status(404).json({ message: "Doctor schedule not found" });
    }

    // Update the schedule fields
    existingSchedule.availableDays = availableDays;
    existingSchedule.availableTimes = availableTimes;

    // Save the updated schedule
    await existingSchedule.save();

    res.json({
      success: true,
      message: "Doctor schedule updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const sendEmailNotification = async (
  userEmail,
  doctorSpeciality,
  patientName,
  appointmentDetails
) => {
  try {
    // Create a transporter for Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // Using Gmail's SMTP service for this example
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password (use App Passwords for Gmail)
      },
    });

    // Email content with styled HTML
    const mailOptions = {
      from: process.env.EMAIL_USER, // Your email address
      to: userEmail, // Recipient's email address
      subject: "Appointment Cancellation Notification",
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                color: #333;
                padding: 20px;
              }
              h1 {
                color: #C0EB6A;
                font-size: 24px;
                text-align: center;
              }
              p {
                font-size: 16px;
                color: #555;
                text-align: center;
              }
              a {
                color: #C0EB6A;
                text-decoration: none;
                font-weight: bold;
              }
              a:hover {
                text-decoration: underline;
              }
              footer {
                text-align: center;
                margin-top: 30px;
                font-size: 14px;
                color: #777;
              }
              footer a {
                color: #C0EB6A;
                text-decoration: none;
              }
              footer a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <!-- Main content -->
            <h1>Appointment Cancellation Notification</h1>
            <p>Dear ${patientName},</p>
            <p>We regret to inform you that your appointment with Dr. ${appointmentDetails.doctorName} has been cancelled due to the doctor's unavailability on ${appointmentDetails.slotDate} at ${appointmentDetails.slotTime}.</p>
            <p>We sincerely apologize for the inconvenience caused. To help you reschedule, please click the link below to explore other doctors in the same specialty and book a new appointment:</p>
            <p><a href="http://localhost:5173/doctors/${doctorSpeciality}">View Doctors and Book an Appointment</a></p>
    
            <!-- Footer -->
            <footer>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>If you did not request this cancellation, please ignore this email.</p>
            </footer>
          </body>
        </html>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    // Find the doctor data
    const docData = await doctorModel.findById(docId);
    if (!docData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Toggle the doctor's availability
    const newAvailability = !docData.available;

    // Update the doctor's availability
    await doctorModel.findByIdAndUpdate(docId, {
      available: newAvailability,
    });

    // If the doctor is unavailable, remove the corresponding slots and cancel all future appointments
    if (!newAvailability) {
      // Find all appointments for this doctor that are not cancelled and are in the future
      const appointments = await appointmentModel.find({
        doctorId: docId,
        cancelled: false,
        slotDate: { $gte: Date.now() }, // Only future appointments
      });

      // Cancel the appointments and remove all slots for each relevant date
      const appointmentUpdates = appointments.map(async (appointment) => {
        // Cancel the appointment
        appointment.cancelled = true;
        appointment.isCompleted = false; // Mark as incomplete
        await appointment.save();

        // Step 4: Remove all time slots for the date of this appointment
        if (docData.slots_booked[appointment.slotDate]) {
          // Remove the entire date from the slots_booked object
          delete docData.slots_booked[appointment.slotDate];
        }

        // Step 5: Update the doctor's slots_booked field in the doctorModel
        await doctorModel.findByIdAndUpdate(docId, {
          slots_booked: docData.slots_booked,
        });

        // Send an email notification to the patient with additional details
        await sendEmailNotification(
          appointment.userData.email,
          docData.speciality,
          appointment.userData.name, // Patient's name
          {
            doctorName: docData.name, // Doctor's name
            slotDate: appointment.slotDate,
            slotTime: appointment.slotTime,
          }
        );
      });

      // Wait for all appointments to be updated, slots to be removed, and emails to be sent
      await Promise.all(appointmentUpdates);

      console.log(`All time slots for doctor ${docId} have been removed.`);
    }

    res.json({
      success: true,
      message: "Doctor availability changed successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  doctorsList,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getDoctorRatings,
  getDoctorAverageRating,
  getDoctorSchedule,
  createDoctorSchedule,
  updateDoctorSchedule,
};
