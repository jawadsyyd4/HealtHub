import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import ratingModel from "../models/ratingModel.js";
import DoctorSchedule from "../models/DoctorScheduleModel.js";
import nodemailer from "nodemailer";
import axios from "axios";

const doctorsList = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select("-password -email") // Exclude sensitive fields
      .populate("speciality"); // Populate the speciality reference

    // Retrieve the average rating for each doctor using the getDoctorAverageRating API
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        // Call the getDoctorAverageRating API
        const response = await axios.get(
          `http://localhost:4000/api/doctor/rating/${doctor._id}`
        );
        const averageRating = response.data.averageRating;

        return {
          ...doctor.toObject(), // Convert doctor document to plain object
          averageRating, // Add the average rating to the doctor object
        };
      })
    );

    res.json({
      success: true,
      doctors: doctorsWithRatings,
    });
  } catch (error) {
    console.error("Error fetching doctors list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve doctors list.",
      error: error.message,
    });
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

    const appointments = await appointmentModel.find({ doctorId }).populate({
      path: "guestPatientId",
      select: "name dateOfBirth",
    });

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

    // Find appointments for the doctor and populate guest patient info if available
    const appointments = await appointmentModel.find({ doctorId }).populate({
      path: "guestPatientId",
      select: "name dateOfBirth",
    });

    let earnings = 0;
    let cancelledAppointments = 0;
    let completedAppointments = 0;
    let patients = [];

    appointments.forEach((item) => {
      if (item.isCompleted) {
        earnings += item.amount;
        completedAppointments++;
      }

      if (item.cancelled) {
        cancelledAppointments++;
      }

      const id = item.userId || item.guestPatientId?._id;
      if (id && !patients.includes(id.toString())) {
        patients.push(id.toString());
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      cancelledAppointments,
      completedAppointments,
      latestAppointments: appointments.slice(-5).reverse(), // last 5, reversed for latest
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
      .select("-password")
      .populate("speciality"); // This line fetches full speciality info

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId, fees, address, available, unavailableTo } = req.body;

    // Fetch doctor
    const docData = await doctorModel.findById(doctorId).populate("speciality");
    if (!docData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Handle availability status change
    if (docData.available !== available) {
      await doctorModel.findByIdAndUpdate(doctorId, { available });

      if (!available && unavailableTo) {
        const unavailableDate = new Date(unavailableTo);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Normalize to midnight for date-only comparison

        if (isNaN(unavailableDate)) {
          return res.json({
            success: false,
            message: "Invalid unavailableTo date.",
          });
        }

        if (unavailableDate < currentDate) {
          return res.json({
            success: false,
            message: "unavailableTo date cannot be in the past.",
          });
        }

        // Update doctor schedule
        await DoctorSchedule.findOneAndUpdate(
          { doctor: doctorId },
          { unavailableTo: unavailableDate },
          { upsert: true }
        );

        const unavailableDateStr = unavailableDate.toISOString().split("T")[0];

        // Cancel upcoming appointments
        const appointmentsToCancel = await appointmentModel
          .find({
            doctorId,
            cancelled: false,
            slotDate: { $lt: unavailableDateStr },
          })
          .populate("guestPatientId", "name email");

        const appointmentUpdates = appointmentsToCancel.map(
          async (appointment) => {
            appointment.cancelled = true;
            appointment.isCompleted = false;
            await appointment.save();

            // Update slots_booked
            const slotDateKey = appointment.slotDate;
            if (docData.slots_booked[slotDateKey]) {
              docData.slots_booked[slotDateKey] = docData.slots_booked[
                slotDateKey
              ].filter((slot) => slot !== appointment.slotTime);
              if (docData.slots_booked[slotDateKey].length === 0) {
                delete docData.slots_booked[slotDateKey];
              }
              await doctorModel.findByIdAndUpdate(doctorId, {
                slots_booked: docData.slots_booked,
              });
            }

            // Notify patient
            const patientEmail =
              appointment.userData?.email || appointment.guestPatientId?.email;
            const patientName =
              appointment.userData?.name || appointment.guestPatientId?.name;

            if (patientEmail) {
              await sendEmailNotification(
                patientEmail,
                docData.speciality.name,
                patientName,
                {
                  doctorName: docData.name,
                  slotDate: appointment.slotDate,
                  slotTime: appointment.slotTime,
                },
                "appointment_cancelled_doctor_unavailable"
              );
            }
          }
        );

        await Promise.all(appointmentUpdates);
      }

      // If doctor is now available, clear the unavailableTo field
      if (available) {
        await DoctorSchedule.findOneAndUpdate(
          { doctor: doctorId },
          { unavailableTo: null }
        );
      }
    }

    // Update fees and address
    await doctorModel.findByIdAndUpdate(doctorId, { fees, address });

    res.json({
      success: true,
      message: "Doctor profile updated successfully.",
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
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
  patientEmail,
  specialityName, // Speciality name now as a parameter
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
      to: patientEmail, // Recipient's email address
      subject: "Appointment Notification",
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
            <h1>Appointment Confirmation</h1>
            <p>Dear ${patientName},</p>
            <p>We are pleased to confirm your appointment with Dr. ${appointmentDetails.doctorName} in the ${specialityName} specialty on ${appointmentDetails.slotDate} at ${appointmentDetails.slotTime}.</p>
            <p>Thank you for choosing us for your healthcare needs. If you need to make any changes, please don't hesitate to contact us.</p>
            <p><a href="http://localhost:5173/doctors">View Doctors and Book an Appointment</a></p>
    
            <!-- Footer -->
            <footer>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>If you did not request this appointment, please ignore this email.</p>
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

    const docData = await doctorModel.findById(docId).populate("speciality"); // Populating the specialityId with the related specialty data

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
      const appointments = await appointmentModel
        .find({
          doctorId: docId,
          cancelled: false,
          slotDate: { $gte: Date.now() }, // Only future appointments
        })
        .populate("guestPatientId", "name email"); // Populating guestPatientId with name and email

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

        // Check if userData exists in the appointment
        const patientEmail = appointment.userData
          ? appointment.userData.email
          : appointment.guestPatientId?.email;

        const patientName = appointment.userData
          ? appointment.userData.name
          : appointment.guestPatientId?.name;

        if (patientEmail) {
          // Send an email notification if userData has an email
          await sendEmailNotification(
            patientEmail,
            docData.speciality.name,
            patientName, // Patient's name
            {
              doctorName: docData.name, // Doctor's name
              slotDate: appointment.slotDate,
              slotTime: appointment.slotTime,
            }
          );
        }
      });

      // Wait for all appointments to be updated, slots to be removed, and emails to be sent
      await Promise.all(appointmentUpdates);
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

const getDoctorSchedules = async (req, res) => {
  try {
    const schedules = await DoctorSchedule.find().populate({
      path: "doctor",
      select: "-password", // exclude password field
      populate: {
        path: "speciality", // Assuming there's a reference to the specialty model in the doctor schema
        select: "name", // Adjust as necessary based on what fields you want to return for specialty
      },
    });

    res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching doctor schedules:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
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
  getDoctorSchedules,
};
