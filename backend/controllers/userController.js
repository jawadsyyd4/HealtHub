import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Stripe from "stripe";
import crypto from "crypto";
import nodemailer from "nodemailer";
// import twilio from "twilio";
import ratingModel from "../models/ratingModel.js";
import DoctorSchedule from "../models/DoctorScheduleModel.js";
import specialityModel from "../models/specialityModel.js";
import axios from "axios";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if user exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // create user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      verificationCode,
    });
    await newUser.save();

    // send verification email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Healthhub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your account",
      html: `
    <div style="font-family: Arial, sans-serif; background: #fff; padding: 20px; border-radius: 8px; color: #333;">
      <h2 style="color: #C0EB6A; text-align: center;">Verify Your Account</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering! Please use the following <strong>6-digit verification code</strong> to verify your email address:</p>
      <p style="font-size: 24px; font-weight: bold; color: #C0EB6A; text-align: center; letter-spacing: 4px;">
        ${verificationCode}
      </p>
      <p style="margin-top: 20px;">If you didn’t register for this account, please ignore this email.</p>
      <p style="margin-top: 10px; font-size: 12px; color: #999; text-align: center;">
        Healthhub &copy; ${new Date().getFullYear()}
      </p>
    </div>
  `,
    });

    res.json({
      success: true,
      message:
        "User registered. Please check your email for the verification code.",
      email, // send email so frontend can save it
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.verificationCode !== code) {
      return res.json({
        success: false,
        message: "Verification failed. Try again.",
      });
    }

    // mark as verified
    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    // generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // or any duration you want
    );

    res.json({
      success: true,
      message: "Account verified successfully!",
      token, // send token to frontend
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      if (user.isVerified) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
      } else {
        res.json({
          success: false,
          message: "Verify your account using email",
        });
      }
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;

    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Mising details" });
    }

    // Check if phone is all digits and 8 characters long
    const isNumeric = /^\d{8}$/.test(phone);

    // Valid Lebanese mobile number prefixes
    const validLebanesePrefixes = [
      "03",
      "70",
      "71",
      "76",
      "78",
      "79",
      "81",
      "82",
    ];
    const hasValidPrefix = validLebanesePrefixes.some((prefix) =>
      phone.startsWith(prefix)
    );

    // Final validation
    if (!isNumeric || !hasValidPrefix) {
      return res.json({
        success: false,
        message: "Phone number must be a valid 8-digit Lebanese number",
      });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // 1. Prevent duplicate or incomplete appointments
    const existingAppointment = await appointmentModel.findOne({
      userId,
      isCompleted: false,
      cancelled: false,
    });

    if (existingAppointment) {
      return res.json({
        success: false,
        message:
          "You have an unfinished appointment. Please complete or cancel it before booking a new one.",
      });
    }

    // 2. Fetch doctor and availability info
    const doctor = await doctorModel
      .findById(docId)
      .select("-password")
      .populate("speciality");

    // 3. Check doctor's unavailability (if any)
    const doctorSchedule = await DoctorSchedule.findOne({ doctor: docId });

    if (doctorSchedule?.unavailableTo) {
      const appointmentDate = new Date(slotDate);
      const unavailableToDate = new Date(doctorSchedule.unavailableTo);

      if (appointmentDate < unavailableToDate) {
        return res.json({
          success: false,
          message: `Doctor is unavailable until ${unavailableToDate.toDateString()}. Please select a later date.`,
        });
      }
    }

    // 4. Prevent duplicate booking on same date/time
    const conflictingAppointment = await appointmentModel.findOne({
      userId,
      slotDate,
      slotTime,
      cancelled: false,
    });

    if (conflictingAppointment) {
      return res.json({
        success: false,
        message:
          "You already have an appointment at this time. Please cancel it before booking another.",
      });
    }

    // 5. Check slot availability
    const bookedSlots = doctor.slots_booked || {};
    if (bookedSlots[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: "Slot not available" });
    }

    // 6. Get user details
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // 7. Create the appointment object but don't save yet
    const newAppointment = new appointmentModel({
      userId,
      doctorId: docId,
      doctorData: doctor,
      userData: user,
      amount: doctor.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    });

    // 8. Prepare confirmation email
    const confirmationLink = `${process.env.BACKEND_URL}/api/user/confirm-appointment/${newAppointment._id}`;
    const deadline = newAppointment.confirmationDeadline;
    const formattedDate = deadline.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = deadline.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Please confirm your appointment",
      html: `
        <div style="font-family: Arial, sans-serif; background: #fff; padding: 20px; border-radius: 8px; color: #333;">
          <h2 style="color: #C0EB6A;">Appointment Confirmation</h2>
          <p>Hello ${user.name},</p>
          <p>Your appointment is scheduled as follows:</p>
          <ul>
            <li><strong>Date:</strong> ${slotDate.replace(/_/g, "/")}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Doctor:</strong> ${doctor.name} (${
        doctor.speciality.name
      })</li>
          </ul>
          <p>Please confirm your appointment by clicking the link below before <strong>${formattedDate} ${formattedTime}</strong>.</p>
          <a href="${confirmationLink}" style="background-color: #C0EB6A; padding: 10px 15px; border-radius: 5px; color: #fff; text-decoration: none;">Confirm Appointment</a>
          <p style="margin-top: 20px;">If you didn’t request this, please ignore this message.</p>
        </div>
      `,
    };

    // 9. Send confirmation email, then save appointment & update doctor slots only if email succeeds
    transporter.sendMail(mailOptions, async (err) => {
      if (err) {
        console.error("Email error:", err);
        return res.json({
          success: false,
          message: "Failed to send confirmation email. Appointment not booked.",
        });
      }

      // Email sent successfully => update slots_booked and save appointment
      bookedSlots[slotDate] = [...(bookedSlots[slotDate] || []), slotTime];
      await doctorModel.findByIdAndUpdate(docId, { slots_booked: bookedSlots });

      await newAppointment.save();

      return res.json({
        success: true,
        message: "Appointment booked! Please confirm via the email link.",
      });
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Find the appointment
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    // Check if the confirmation deadline has passed
    const now = new Date();
    if (now > appointment.confirmationDeadline) {
      return res
        .status(400)
        .json({ success: false, message: "Confirmation deadline has passed" });
    }

    // Confirm the appointment
    appointment.confirmed = true;
    await appointment.save();

    // Redirect to the "my appointments" page
    res.redirect(`${process.env.CLIENT_URL}/my-appointments`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listAppointments = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find appointments for the user and populate the doctorData and doctorData.speciality
    const appointments = await appointmentModel.find({ userId }).populate({
      path: "doctorData",
      populate: {
        path: "speciality",
        model: "speciality", // Make sure this matches the name of your Speciality model
      },
    });

    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    // Destructure the necessary data from the request body
    const { userId, appointmentId } = req.body;

    // Step 1: Find the appointment data
    const appointmentData = await appointmentModel.findById(appointmentId);

    // Check if the appointment exists and if the user is authorized to cancel it
    if (!appointmentData) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.userId !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
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

const paymentStripepay = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    const appointmentData = await appointmentModel
      .findById(appointmentId)
      .populate({
        path: "doctorData",
        populate: {
          path: "speciality",
          model: "speciality", // Make sure this matches the name of your Speciality model
        },
      });
    if (!appointmentData) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized action" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                "Appointment Payment " +
                "(" +
                appointmentData.doctorData.speciality.name +
                ")",
              description:
                appointmentData.slotDate.split("-")[0] +
                "-" +
                appointmentData.slotDate.split("-")[1] +
                "-" +
                appointmentData.slotDate.split("-")[2] +
                ", " +
                appointmentData.slotTime,
              images: [appointmentData.doctorData.image],
            },
            unit_amount: appointmentData.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.BACKEND_URL}/api/user//payment/success?appointmentId=${appointmentId}`,
      cancel_url: `${process.env.BACKEND_URL}/api/user//payment/cancel?appointmentId=${appointmentId}`,
      metadata: { appointmentId: appointmentId },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Route for successful payments (important!)
async function handlePaymentSuccess(req, res) {
  const { appointmentId } = req.query; // Get appointmentId from query params

  try {
    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        payment: true,
        confirmed: true, // Set confirmed to true
      },
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).send("Appointment not found");
    }

    // Optionally send the updated appointment data back to the client
    // res.json({ success: true, appointment: updatedAppointment });
    res.redirect(`${process.env.CLIENT_URL}/my-appointments`); // Or render a success page, or redirect to a thank you page

    // res.send("Payment Successful! Thank you for your booking."); // You can also send a simple message
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).send("Error updating payment status.");
  }
}

const rateDoctor = async (req, res) => {
  try {
    const { userId, doctorId, rating } = req.body;

    // Check if the doctor exists
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if the user has already rated the doctor
    const existingRating = await ratingModel.findOne({ doctorId, userId });
    if (existingRating) {
      // If rating exists, update the rating with the new value
      existingRating.rating = rating; // Update the rating value
      await existingRating.save(); // Save the updated rating
      return res.json({
        success: true,
        message: "Your rating has been updated successfully",
      });
    }

    // If no existing rating, create a new rating
    const newRating = new ratingModel({
      doctorId: doctorId,
      userId: userId,
      rating: rating,
    });

    await newRating.save();

    res.json({ success: true, message: "Rating submitted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const checkUserRating = async (req, res) => {
  try {
    const { userId } = req.body;
    const { doctorId } = req.params; // Get doctorId from query parameters
    if (!doctorId) {
      return res.status(400).json({ message: "Doctor ID is required" });
    }

    const existingRating = await ratingModel.findOne({ doctorId, userId });

    if (!existingRating) {
      return res.json({ success: false, message: "rating record not found" });
    }

    res.json({ success: true, existingRating });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getDocSlots = async (req, res) => {
  try {
    const docId = req.params.doctorId;

    const doctor = await doctorModel.findById(docId);

    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    const doctorSchedule = await DoctorSchedule.findOne({ doctor: docId });
    if (!doctorSchedule) {
      return res.json({
        success: false,
      });
    }
    const availableTimes = doctorSchedule.availableTimes;
    const unavailableTo = doctorSchedule.unavailableTo;
    res.json({ success: true, availableTimes, unavailableTo });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// STEP 1: Request reset
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save token & expiry (skip validation for speed)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1h
    await user.save({ validateBeforeSave: false });

    const resetLink = `${
      process.env.CLIENT_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    // Respond quickly before sending email
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });

    // Send email in background
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below:</p>
        <p><a href="${resetLink}">Reset Your Password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    });
  } catch (err) {
    console.error("Forget password error:", err);
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: err.message,
    });
  }
};

// STEP 2: Reset password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // still valid
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password successfully reset" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: err.message,
    });
  }
};

const docMate = async (req, res) => {
  try {
    const { specialties = [], days = [], times = [] } = req.body;

    const specialitiesData = await specialityModel.find();
    const specialitiesMap = new Map(
      specialitiesData.map((s) => [s.name.toLowerCase(), s])
    );

    // Filter valid specialties from input
    const matchedSpecialties = specialties.filter((s) =>
      specialitiesMap.has(s.toLowerCase())
    );

    // Normalize days to capitalized form and filter valid days
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const normalizedDays = days
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
      .filter((d) => daysOfWeek.includes(d));

    // Normalize times to "HH:mm" 24h format (accept only first time in array)
    // We will process all times, so let's normalize all times
    const normalizeTime = (raw) => {
      const match = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!match) return null;
      let [_, hourStr, minStr, ampm] = match;
      let hour = parseInt(hourStr, 10);
      const minutes = parseInt(minStr || "0", 10);
      if (ampm?.toLowerCase() === "pm" && hour < 12) hour += 12;
      if (ampm?.toLowerCase() === "am" && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    };
    const normalizedTimes = times.map(normalizeTime).filter((t) => t !== null);

    // Helper for adjacent days
    const getAdjacentDays = (day) => {
      const index = daysOfWeek.indexOf(day);
      return {
        previous: daysOfWeek[(index + 6) % 7],
        next: daysOfWeek[(index + 1) % 7],
      };
    };

    // Function to check if doctor is available at any of given days and times
    // Availability structure: { Monday: {start: "09:00", end: "17:00"}, ... }
    const isAvailable = (availability, day, time) => {
      const slot = availability[day];
      if (!slot) return false;
      if (!time) return true; // If no time provided, just day check
      return slot.start <= time && slot.end >= time;
    };

    let allDoctors = [];
    let messages = [];

    // Handle case: no specialties provided → use all specialties
    const specialtiesToSearch =
      matchedSpecialties.length > 0
        ? matchedSpecialties
        : specialitiesData.map((s) => s.name);

    // For each specialty, find doctors and filter by days/times
    for (const specialtyName of specialtiesToSearch) {
      const specialtyDoc = specialitiesMap.get(specialtyName.toLowerCase());

      const availableDoctors = await doctorModel
        .find({ speciality: specialtyDoc._id })
        .populate("speciality", "name")
        .select("_id name image");

      if (availableDoctors.length === 0) {
        messages.push(`No available doctors for ${specialtyName}.`);

        // Fallback: if day or time is provided, try all other specialties
        if (normalizedDays.length > 0 || normalizedTimes.length > 0) {
          const allFallbackDoctors = await doctorModel
            .find({})
            .populate("speciality", "name")
            .select("_id name image");

          const fallbackAvailabilityData = await Promise.all(
            allFallbackDoctors.map(async (doctor) => {
              try {
                const { data } = await axios.get(
                  `${process.env.BACKEND_URL}/api/user/availble-day/${doctor._id}`
                );
                return { doctor, availability: data?.availableTimes || {} };
              } catch {
                return { doctor, availability: {} };
              }
            })
          );

          let matchedFallbackDoctors = [];

          // Match any doctor available on any of the requested days/times
          for (const day of normalizedDays.length > 0
            ? normalizedDays
            : daysOfWeek) {
            for (const time of normalizedTimes.length > 0
              ? normalizedTimes
              : [""]) {
              const fallbackMatches = fallbackAvailabilityData.filter(
                ({ availability }) => isAvailable(availability, day, time)
              );
              matchedFallbackDoctors.push(
                ...fallbackMatches.map((d) => d.doctor)
              );
              if (fallbackMatches.length > 0) {
                messages.push(
                  `Found ${
                    fallbackMatches.length
                  } fallback doctor(s) on ${day}${
                    time ? " at " + time : ""
                  } in other specialties.`
                );
              }
            }
          }

          // Deduplicate and add to allDoctors
          const fallbackUnique = [
            ...new Map(
              matchedFallbackDoctors.map((d) => [d._id.toString(), d])
            ).values(),
          ];
          allDoctors.push(...fallbackUnique);
        }

        continue; // Skip rest of current specialty since no doctors found
      }

      // Fetch availability for all doctors in this specialty
      const availabilityData = await Promise.all(
        availableDoctors.map(async (doctor) => {
          try {
            const { data } = await axios.get(
              `${process.env.BACKEND_URL}/api/user/availble-day/${doctor._id}`
            );
            return { doctor, availability: data?.availableTimes || {} };
          } catch {
            return { doctor, availability: {} };
          }
        })
      );

      let specialtyDoctors = [];

      // Conditions based on presence of inputs:

      // Condition 1: no specialties, no days, no times → already handled by specialtiesToSearch fallback to all
      // so treat below for specialties present or not.

      // Condition 1 simplified: no days, no times → all doctors from specialty
      if (normalizedDays.length === 0 && normalizedTimes.length === 0) {
        specialtyDoctors = availabilityData.map((d) => d.doctor);
        messages.push(
          `Found ${specialtyDoctors.length} doctor(s) for ${specialtyName} with no day/time filter.`
        );
      }

      // Condition 2: no days, times present
      else if (normalizedDays.length === 0 && normalizedTimes.length > 0) {
        // Match any time on any day
        for (const time of normalizedTimes) {
          const matches = availabilityData.filter(({ availability }) =>
            Object.values(availability).some(
              (slot) => slot.start <= time && slot.end >= time
            )
          );
          specialtyDoctors.push(...matches.map((d) => d.doctor));
          messages.push(
            `Found ${matches.length} doctor(s) for ${specialtyName} available at time ${time} on any day.`
          );
        }
        // Deduplicate after loop
        specialtyDoctors = [
          ...new Map(
            specialtyDoctors.map((d) => [d._id.toString(), d])
          ).values(),
        ];
      }

      // Condition 3: days present, no times
      else if (normalizedDays.length > 0 && normalizedTimes.length === 0) {
        for (const day of normalizedDays) {
          const matches = availabilityData.filter(
            ({ availability }) => availability[day]
          );
          specialtyDoctors.push(...matches.map((d) => d.doctor));
          messages.push(
            `Found ${matches.length} doctor(s) for ${specialtyName} available on ${day}.`
          );
        }
        // Deduplicate
        specialtyDoctors = [
          ...new Map(
            specialtyDoctors.map((d) => [d._id.toString(), d])
          ).values(),
        ];
      }

      // Condition 4,7,8: days and times both present (specialties may or may not present)
      else if (normalizedDays.length > 0 && normalizedTimes.length > 0) {
        let foundExact = false;
        // Try exact day + time matches first (any day + any time)
        for (const day of normalizedDays) {
          for (const time of normalizedTimes) {
            const matches = availabilityData.filter(({ availability }) =>
              isAvailable(availability, day, time)
            );
            if (matches.length > 0) {
              specialtyDoctors.push(...matches.map((d) => d.doctor));
              messages.push(
                `Found ${matches.length} doctor(s) for ${specialtyName} on ${day} at ${time}.`
              );
              foundExact = true;
            }
          }
        }
        specialtyDoctors = [
          ...new Map(
            specialtyDoctors.map((d) => [d._id.toString(), d])
          ).values(),
        ];

        if (!foundExact) {
          let fallbackAdded = false;

          // 1. Try adjacent days (existing fallback logic)
          for (const day of normalizedDays) {
            const { previous, next } = getAdjacentDays(day);
            for (const fallbackDay of [previous, next]) {
              for (const time of normalizedTimes) {
                const fallbackMatches = availabilityData.filter(
                  ({ availability }) =>
                    isAvailable(availability, fallbackDay, time)
                );
                if (fallbackMatches.length > 0) {
                  specialtyDoctors.push(
                    ...fallbackMatches.map((d) => d.doctor)
                  );
                  messages.push(
                    `No doctors for ${specialtyName} on ${day}, but found ${fallbackMatches.length} on adjacent day ${fallbackDay} at ${time}.`
                  );
                  fallbackAdded = true;
                  break;
                }
              }
              if (fallbackAdded) break;
            }
            if (fallbackAdded) break;
          }

          specialtyDoctors = [
            ...new Map(
              specialtyDoctors.map((d) => [d._id.toString(), d])
            ).values(),
          ];

          // 2. If still none found, fallback to all doctors available on that day (any specialty)
          if (!fallbackAdded && specialtyDoctors.length === 0) {
            for (const day of normalizedDays) {
              const allDocs = await doctorModel
                .find({ available: true })
                .populate("speciality", "name")
                .select("_id name image");

              const availabilityData = await Promise.all(
                allDocs.map(async (doctor) => {
                  try {
                    const { data } = await axios.get(
                      `${process.env.BACKEND_URL}/api/user/availble-day/${doctor._id}`
                    );
                    return { doctor, availability: data?.availableTimes || {} };
                  } catch {
                    return { doctor, availability: {} };
                  }
                })
              );

              const dayMatches = availabilityData.filter(
                ({ availability }) => availability[day]
              );
              if (dayMatches.length > 0) {
                allDoctors.push(...dayMatches.map((d) => d.doctor));
                messages.push(
                  `No doctors for ${specialtyName} on ${day}, but found ${dayMatches.length} other doctors available on ${day}.`
                );
              }
            }

            // 3. Also return doctors of this specialty on other days
            const specialtyMatchesOtherDays = availabilityData.filter(
              ({ doctor, availability }) => {
                return Object.entries(availability).some(
                  ([dayKey, slot]) =>
                    normalizedDays.every((d) => d !== dayKey) &&
                    doctor.speciality.name === specialtyName
                );
              }
            );
            if (specialtyMatchesOtherDays.length > 0) {
              allDoctors.push(
                ...specialtyMatchesOtherDays.map((d) => d.doctor)
              );
              messages.push(
                `Also found ${specialtyMatchesOtherDays.length} doctor(s) with specialty ${specialtyName} available on other days.`
              );
            }
          }
        }
      }

      // Condition 5,6: specialties present but no days
      else if (matchedSpecialties.length > 0 && normalizedDays.length === 0) {
        // If times present, filter by any day matching times
        if (normalizedTimes.length > 0) {
          for (const time of normalizedTimes) {
            const matches = availabilityData.filter(({ availability }) =>
              Object.values(availability).some(
                (slot) => slot.start <= time && slot.end >= time
              )
            );
            specialtyDoctors.push(...matches.map((d) => d.doctor));
            messages.push(
              `Found ${matches.length} doctor(s) for ${specialtyName} at time ${time} on any day.`
            );
          }
          specialtyDoctors = [
            ...new Map(
              specialtyDoctors.map((d) => [d._id.toString(), d])
            ).values(),
          ];
        } else {
          // No days, no times → return all doctors in specialty (already handled in condition 1)
          specialtyDoctors = availabilityData.map((d) => d.doctor);
          messages.push(
            `Found ${specialtyDoctors.length} doctor(s) for ${specialtyName} with no day/time filter.`
          );
        }
      }

      allDoctors.push(...specialtyDoctors);
    }

    // Deduplicate all doctors
    const uniqueDoctorsMap = new Map();
    for (const doc of allDoctors) {
      uniqueDoctorsMap.set(doc._id.toString(), doc);
    }

    // Fetch doctors with ratings or other details if needed
    const finalDoctors = await fetchDoctorsWithRatings(
      Array.from(uniqueDoctorsMap.values())
    );

    return res.json({
      success: finalDoctors.length > 0,
      message: messages.join(" "),
      doctors: finalDoctors,
    });
  } catch (err) {
    console.error("Error in docMate:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Utility function to get ratings for doctors
async function fetchDoctorsWithRatings(doctorList) {
  return Promise.all(
    doctorList.map(async (doctor) => {
      try {
        const { data } = await axios.get(
          `${process.env.BACKEND_URL}/api/doctor/rating/${doctor._id}`
        );
        return {
          _id: doctor._id,
          name: doctor.name,
          iamge: doctor.image,
          speciality: doctor.speciality.name,
          avgRate: data.averageRating || 0,
        };
      } catch {
        return {
          _id: doctor._id,
          name: doctor.name,
          iamge: doctor.image,
          speciality: doctor.speciality.name,
          avgRate: 0,
        };
      }
    })
  );
}

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  confirmAppointment,
  listAppointments,
  cancelAppointment,
  paymentStripepay,
  handlePaymentSuccess,
  verifyUser,
  rateDoctor,
  checkUserRating,
  getDocSlots,
  forgetPassword,
  resetPassword,
  docMate,
};
