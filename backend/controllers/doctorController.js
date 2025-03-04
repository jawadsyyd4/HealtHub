import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import ratingModel from "../models/ratingModel.js";

const changeAvailablity = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);

    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });

    res.json({ success: true, message: "Availability changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

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

    await doctorModel.findByIdAndUpdate(doctorId, {
      fees,
      address,
      available,
    });

    res.json({ success: true, message: "Profile updated." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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

    res.status(200).json({ averageRating });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
export {
  changeAvailablity,
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
};
