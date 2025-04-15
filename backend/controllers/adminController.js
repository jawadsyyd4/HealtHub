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

// get all appointment list
const appointmentAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
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

    const dashData = {
      doctors: doctors.length,
      patients: users.length,
      appointments: appointments.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
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
};
