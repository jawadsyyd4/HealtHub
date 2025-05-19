// ADMIN Controller
import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import DoctorSchedule from "../models/DoctorScheduleModel.js";
import ratingModel from "../models/ratingModel.js";
import specialityModel from "../models/specialityModel.js";
import guestPatientModel from "../models/guestPatientModel.js";
import axios from "axios";

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      address,
      fees,
    } = req.body;
    const imageFile = req.file;
    const specialtyDocument = await specialityModel.findOne({
      name: speciality,
    });
    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !address ||
      !fees
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // validating strong password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = (await imageUpload).secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality: specialtyDocument._id,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };
    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API FOR ADMIN LOGIN
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = await jwt.sign(email + password, process.env.JWT_SECRET);

      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel
      .find({})
      .select("-password")
      .populate("speciality"); // Populate the 'speciality' field

    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentAdmin = async (req, res) => {
  try {
    // Fetch all appointments and populate guestPatientId with guest data
    const appointments = await appointmentModel
      .find({})
      .populate("guestPatientId", "name dateOfBirth"); // Adjust the fields you want to populate from the guestPatientModel

    // Return the appointments with populated guest data
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const appointmentCancel = async (req, res) => {
  try {
    // Destructure the necessary data from the request body
    const { appointmentId } = req.body;

    // Step 1: Find the appointment data
    const appointmentData = await appointmentModel.findById(appointmentId);

    // Check if the appointment exists and if the user is authorized to cancel it
    if (!appointmentData) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Step 2: Mark the appointment as canceled
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // Destructure doctor ID, slotDate, and slotTime from the appointment data
    const { doctorId, slotDate, slotTime } = appointmentData;

    // Step 3: Find the doctor document
    const doctorData = await doctorModel.findById(doctorId);
    if (!doctorData) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Step 4: Update the doctor's slots_booked
    let slots_booked = doctorData.slots_booked;

    if (slots_booked[slotDate]) {
      // Filter out the canceled slotTime from the array for that date
      slots_booked[slotDate] = slots_booked[slotDate].filter(
        (time) => time !== slotTime
      );

      // If no slots are left for this date, remove the date entry
      if (slots_booked[slotDate].length === 0) {
        delete slots_booked[slotDate];
      }

      // Step 5: Update the doctor's slots_booked field in the doctorModel
      await doctorModel.findByIdAndUpdate(doctorId, { slots_booked });

      return res.json({
        success: true,
        message: "Appointment canceled.",
      });
    }

    return res
      .status(400)
      .json({ success: false, message: "Slot not found for cancellation" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    // 1. Get average rating for each doctor via API
    const doctorRatings = await Promise.all(
      doctors.map(async (doctor) => {
        try {
          const response = await axios.get(
            `http://localhost:4000/api/doctor/rating/${doctor._id}`
          );
          return {
            doctor,
            averageRating: response.data.averageRating || 0,
          };
        } catch {
          return { doctor, averageRating: 0 };
        }
      })
    );

    const minRatingValue = Math.min(
      ...doctorRatings.map((d) => d.averageRating)
    );
    const minRatedDoctors = doctorRatings.filter(
      (d) => d.averageRating === minRatingValue
    );

    // 2. Calculate unique patient counts per doctor
    const doctorPatientMap = {};
    appointments.forEach(({ doctorId, userId }) => {
      if (!doctorPatientMap[doctorId]) doctorPatientMap[doctorId] = new Set();
      if (userId) doctorPatientMap[doctorId].add(userId.toString());
    });

    const maxPatientCount = Math.max(
      0,
      ...Object.values(doctorPatientMap).map((set) => set.size)
    );

    const maxPatientsDoctors = Object.entries(doctorPatientMap)
      .filter(([_, set]) => set.size === maxPatientCount)
      .map(([doctorId]) => {
        const doctor = doctors.find((doc) => doc._id.toString() === doctorId);
        return doctor ? { doctor, patientCount: maxPatientCount } : null;
      })
      .filter(Boolean);

    // 3. Doctors with no appointments this week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const appointmentsThisWeek = appointments.filter((app) => {
      const slotDate = new Date(app.slotDate);
      return slotDate >= weekStart && slotDate <= weekEnd;
    });

    const doctorsWithAppointmentsThisWeek = new Set(
      appointmentsThisWeek.map((app) => app.doctorId.toString())
    );

    const doctorsNoAppointmentsThisWeek = doctors.filter(
      (doc) => !doctorsWithAppointmentsThisWeek.has(doc._id.toString())
    );

    // 4. Doctor(s) with most cancelled appointments
    const cancelCounts = {};
    appointments.forEach(({ doctorId, cancelled }) => {
      if (cancelled) {
        const id = doctorId.toString();
        cancelCounts[id] = (cancelCounts[id] || 0) + 1;
      }
    });

    const maxCancelled = Math.max(0, ...Object.values(cancelCounts));

    const mostCancelledDoctors = Object.entries(cancelCounts)
      .filter(([_, count]) => count === maxCancelled)
      .map(([doctorId]) => {
        const doctor = doctors.find((doc) => doc._id.toString() === doctorId);
        return doctor ? { doctor, cancelledCount: maxCancelled } : null;
      })
      .filter(Boolean);

    // 🔹 5. Doctors with unavailableTo set
    const temporarilyUnavailable = await DoctorSchedule.find({
      unavailableTo: { $ne: null },
    }).populate("doctor", "name email");

    const doctorsTemporarilyUnavailable = temporarilyUnavailable.map(
      (entry) => ({
        doctor: entry.doctor,
        unavailableTo: entry.unavailableTo,
      })
    );

    // ✅ Final dashboard data
    const dashData = {
      doctors: doctors.length,
      patients: users.length,
      appointments: appointments.length,
      latestAppointments: appointments.slice().reverse().slice(0, 5),
      minRatedDoctors: minRatedDoctors.map((d) => ({
        doctor: d.doctor,
        averageRating: d.averageRating,
      })),
      maxPatientsDoctors,
      doctorsNoAppointmentsThisWeek,
      mostCancelledDoctors,
      doctorsTemporarilyUnavailable, // <-- NEW section
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const { docId } = req.params;
    if (!docId) {
      return res.json({ success: false, message: "Doctor Id is required" });
    }
    const doctor = await doctorModel
      .findById(docId)
      .select("-password")
      .populate("speciality"); // Populate the 'speciality' field

    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }
    res.json({ success: true, doctor });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateDoctorInfo = async (req, res) => {
  try {
    const { docId } = req.params; // Get docId from route params
    const { name, speciality, degree, experience, about, address, fees } =
      req.body;
    const imageFile = req.file; // Image file, if uploaded

    // Check for missing fields
    if (
      !name ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !address ||
      !fees
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    // Find the existing doctor by ID
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // If an image is uploaded, upload it to Cloudinary
    let imageUrl = doctor.image; // Retain old image URL if no new image is provided
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url; // Get the new image URL
    }
    const specialtyDocument = await specialityModel.findOne({
      name: speciality,
    });
    // Update the doctor's details
    doctor.name = name || doctor.name;
    doctor.speciality = specialtyDocument._id || doctor.speciality;
    doctor.degree = degree || doctor.degree;
    doctor.experience = experience || doctor.experience;
    doctor.about = about || doctor.about;
    doctor.fees = fees || doctor.fees;
    doctor.address = JSON.parse(address) || doctor.address;
    doctor.image = imageUrl;

    // Save the updated doctor record
    await doctor.save();

    res
      .status(200)
      .json({ success: true, message: "Doctor updated successfully", doctor });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const deleteDoctor = async (req, res) => {
  const { doctorId } = req.params;
  console.log(doctorId);
  try {
    // Step 1: Delete all appointments associated with the doctor
    await appointmentModel.deleteMany({ doctorId });

    // Step 2: Delete the doctor's schedule
    await DoctorSchedule.deleteMany({ doctor: doctorId });

    // Step 3: Delete all ratings associated with the doctor
    await ratingModel.deleteMany({ doctorId: doctorId });

    // Step 4: Delete the doctor record itself
    const doctor = await doctorModel.findByIdAndDelete(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({
      success: true,
      message: "Doctor and associated data deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting the doctor", error });
  }
};

// Create a new guest patient
const createGuestPatient = async (req, res) => {
  try {
    const { name, phone, email, gender, dateOfBirth, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required." });
    }

    const newPatient = new guestPatientModel({
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      notes,
    });

    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error("Error creating guest patient:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Update guest patient info
const updateGuestPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, gender, dateOfBirth, notes } = req.body;

    const updatedPatient = await guestPatientModel.findByIdAndUpdate(
      id,
      { name, phone, email, gender, dateOfBirth, notes },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Guest patient not found." });
    }

    res.status(200).json(updatedPatient);
  } catch (error) {
    console.error("Error updating guest patient:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getAllGuestPatients = async (req, res) => {
  try {
    const patients = await guestPatientModel.find().sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching guest patients:", error);
    res.status(500).json({ message: "Failed to fetch guest patients" });
  }
};

const getGuestPatientById = async (req, res) => {
  const { patientId } = req.params; // Extract patientId from request parameters

  try {
    // Find the patient by ID in the database
    const patient = await guestPatientModel.findById(patientId);

    if (!patient) {
      // If no patient is found, send a 404 error
      return res.status(404).json({ message: "Patient not found" });
    }

    // If the patient is found, send the patient data
    res.status(200).json(patient);
  } catch (error) {
    // Catch any errors that occur while querying the database
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyName } = req.body;

    if (!specialtyName) {
      return res.status(400).json({ message: "Specialty name is required." });
    }

    // Find the specialty by name
    const specialty = await specialityModel.findOne({ name: specialtyName });

    if (!specialty) {
      return res.status(404).json({ message: "Specialty not found." });
    }

    // Find all available doctors with the matched specialty ID
    const doctors = await doctorModel
      .find({ speciality: specialty._id })
      .select("-password");

    return res.status(200).json({ doctors });
  } catch (error) {
    console.error("Error in getDoctorsBySpecialty:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required." });
    }

    const schedule = await DoctorSchedule.findOne({ doctor: doctorId });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for this doctor." });
    }

    return res.status(200).json({
      availableDays: schedule.availableDays,
      unavailableTo: schedule.unavailableTo,
    });
  } catch (error) {
    console.error("Error in getDoctorAvailability:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDayTimeRange = async (req, res) => {
  try {
    const { doctorId, day } = req.body;

    if (!doctorId || !day) {
      return res
        .status(400)
        .json({ message: "Doctor ID and day are required." });
    }

    const schedule = await DoctorSchedule.findOne({ doctor: doctorId });

    if (!schedule) {
      return res.status(404).json({ message: "Doctor schedule not found." });
    }

    const timeSlot = schedule.availableTimes.get(day);

    if (!timeSlot) {
      return res
        .status(404)
        .json({ message: `No time slots available for ${day}.` });
    }

    return res.status(200).json({
      day,
      start: timeSlot.start,
      end: timeSlot.end,
    });
  } catch (error) {
    console.error("Error in getDayTimeRange:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const createAppointment = async (req, res) => {
  const { doctorId, slotDate, slotTime, doctorData, amount, day } = req.body;

  if (!doctorId || !slotDate || !slotTime || !doctorData || !amount || !day) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const roundToNearest30 = (time24h) => {
    let [hours, minutes] = time24h.split(":").map(Number);
    if (minutes < 15) {
      minutes = 0;
    } else if (minutes < 45) {
      minutes = 30;
    } else {
      minutes = 0;
      hours += 1;
    }
    if (hours === 24) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const to12HourFormat = (time24) => {
    let [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${period}`;
  };

  const convertedTime = convertTo24Hour(slotTime);
  const formattedSlotTime = roundToNearest30(convertedTime);

  try {
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found." });
    }

    const schedule = await DoctorSchedule.findOne({ doctor: doctorId });
    if (!schedule) {
      return res.json({
        success: false,
        message: "Doctor schedule not found.",
      });
    }

    // Check against unavailableTo
    if (schedule.unavailableTo) {
      const appointmentDateStr = new Date(slotDate).toISOString().split("T")[0];
      const unavailableToStr = new Date(schedule.unavailableTo)
        .toISOString()
        .split("T")[0];
      if (appointmentDateStr < unavailableToStr) {
        return res.json({
          success: false,
          message: `Cannot book an appointment before ${unavailableToStr}. Doctor is unavailable until then.`,
        });
      }
    }

    // Validate day and time
    if (!schedule.availableDays.includes(day)) {
      return res.json({
        success: false,
        message: `Doctor is not available on ${day}.`,
      });
    }

    const timeRange = schedule.availableTimes.get(day);
    if (!timeRange) {
      return res.json({
        success: false,
        message: `No available time range defined for ${day}.`,
      });
    }

    const { start, end } = timeRange;
    if (formattedSlotTime < start || formattedSlotTime > end) {
      return res.json({
        success: false,
        message: `Selected time (${formattedSlotTime}) is outside of the doctor's available hours (${start} - ${end}) on ${day}.`,
      });
    }

    const slotTimeWithPeriod = to12HourFormat(formattedSlotTime);

    // Check for existing slot booking
    if (!doctor.slots_booked[slotDate]) {
      doctor.slots_booked[slotDate] = [];
    }

    if (doctor.slots_booked[slotDate].includes(slotTimeWithPeriod)) {
      return res.json({
        success: false,
        message: `The slot (${slotTimeWithPeriod}) on ${slotDate} is already booked.`,
      });
    }

    // Book the slot
    doctor.slots_booked[slotDate].push(slotTimeWithPeriod);
    doctor.markModified("slots_booked");

    const newAppointment = new appointmentModel({
      doctorId,
      slotDate,
      slotTime: slotTimeWithPeriod,
      doctorData,
      amount,
      guestPatientId: doctorData.guestPatientId || null,
      date: Date.now(),
      payment: false,
      isCompleted: false,
      cancelled: false,
      confirmed: true,
    });

    await newAppointment.save();
    await doctor.save();

    res.json({
      success: true,
      message: "Appointment created and doctor's slot updated successfully.",
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.json({
      success: false,
      message: "Failed to create appointment.",
      error: error.message,
    });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentAdmin,
  appointmentCancel,
  adminDashboard,
  getDoctorById,
  updateDoctorInfo,
  deleteDoctor,
  createGuestPatient,
  updateGuestPatient,
  getAllGuestPatients,
  getGuestPatientById,
  getDoctorsBySpecialty,
  getDoctorAvailability,
  getDayTimeRange,
  createAppointment,
};
