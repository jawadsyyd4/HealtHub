import validator from "validator";
import bcrypt, { hash } from "bcrypt";
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

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }

    // Generate a verification code.
    const verificationCode = crypto.randomBytes(20).toString("hex");

    // Hash the password.
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new userModel({
      name,
      email,
      password: hashedPassword,
      verificationCode,
    });

    await user.save();

    // Send verification email.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Please verify your email",
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
              .logo {
                display: block;
                margin: 0 auto 20px;
                width: 150px; /* Adjust logo size as needed */
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
            <h1>Verify your email</h1>
            <p>Click <a href="http://localhost:4000/api/user/verify-email?code=${verificationCode}">here</a> to verify your email.</p>
    
            <!-- Footer -->
            <footer>
              <p>If you did not request this email, please ignore it.</p>
              <p>For any questions, contact our <a href="mailto:jawadsyyd@gmail.com">support team</a>.</p>
            </footer>
          </body>
        </html>
      `,
    };

    // Send email asynchronously and return a response once done
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: "Error sending email" });
      }

      // After email is sent, return the success response with the token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

      return res.json({
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        token,
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { code } = req.query;

    const user = await userModel.findOne({ verificationCode: code });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    user.isVerified = true;
    await user.save();
    res.redirect("http://localhost:5173/");
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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

    // Fetch doctor data and check availability
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // Check if user already has an appointment at the same date and time
    const existingAppointment = await appointmentModel.findOne({
      userId,
      slotDate,
      slotTime,
    });

    if (existingAppointment) {
      if (!existingAppointment.cancelled) {
        return res.json({
          success: false,
          message:
            "You already have an appointment with another doctor at this time. Please cancel it before booking a new one.",
        });
      }
    }

    let slots_booked = docData.slots_booked;

    // Checking if slot available
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Slot not available" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    // Fetch user data
    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked; // Remove slots_booked to avoid saving it in the appointment

    // Create the appointment data
    const appointmentData = {
      userId,
      doctorId: docId, // Ensure docId is assigned to doctorId field
      doctorData: docData, // Ensure the complete doctor data is passed
      userData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(), // Current timestamp
    };

    // Create a new appointment
    const newAppointment = new appointmentModel(appointmentData);

    // Save the new appointment
    await newAppointment.save();

    // Generate the confirmation link now that we have the appointment ID
    const confirmationLink = `http://localhost:4000/api/user/confirm-appointment/${newAppointment._id}`;

    // Format confirmation deadline with AM/PM
    const confirmationDeadline = newAppointment.confirmationDeadline;
    const confirmationDate = confirmationDeadline.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const confirmationTime = confirmationDeadline.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Send confirmation email with a link
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: "Please confirm your appointment",
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
                color: #C0EB6A;
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
              .btn {
                display: inline-block;
                background-color: #C0EB6A;
                color: white;
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
                font-size: 16px;
                text-align: center;
              }
              .btn:hover {
                background-color: #45a049;
              }
              footer {
                margin-top: 30px;
                text-align: center;
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
            <div class="container">
              <h1>Appointment Confirmation</h1>
              <p>Dear ${userData.name},</p>
              <p>We are happy to inform you that your appointment is scheduled for:</p>
              <div class="appointment-details">
                <p><strong>Date:</strong> ${slotDate.split("_").join("/")}</p>
                <p><strong>Time:</strong> ${slotTime}</p>
                <p><strong>Doctor:</strong> Dr. ${docData.name}</p>
                <p><strong>Specialty:</strong> ${docData.speciality}</p>
              </div>
              <p>Please confirm your attendance by clicking the button below:</p>
              <a href="${confirmationLink}" class="btn">Confirm Appointment</a>
              <p><strong>Note:</strong> You must confirm your appointment before the confirmation deadline of ${confirmationDate} ${confirmationTime}.</p>
              <footer>
                <p>If you did not request this appointment, please disregard this email.</p>
                <p>If you have any questions or need to reschedule, feel free to contact us.</p>
              </footer>
            </div>
          </body>
        </html>
      `,
    };

    // Save the updated slot bookings back to the doctor model
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    // Send email asynchronously and return a response once done
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: "Error sending email" });
      }
      return res.json({
        success: true,
        message:
          "Appointment booked! Please check your email to confirm the appointment.",
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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
    res.redirect("http://localhost:5173/my-appointments");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const listAppointments = async (req, res) => {
  try {
    const { userId } = req.body;

    const appointments = await appointmentModel.find({ userId });

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

    const appointmentData = await appointmentModel.findById(appointmentId);

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
                appointmentData.doctorData.speciality +
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
      success_url: `http://localhost:4000/api/user//payment/success?appointmentId=${appointmentId}`,
      cancel_url: `http://localhost:4000/api/user//payment/cancel?appointmentId=${appointmentId}`,
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
      { payment: true }, // Update paymentStatus to true
      { new: true } // Return the updated document
    );

    if (!updatedAppointment) {
      return res.status(404).send("Appointment not found");
    }

    // Optionally send the updated appointment data back to the client
    // res.json({ success: true, appointment: updatedAppointment });
    res.redirect("http://localhost:5173/my-appointments"); // Or render a success page, or redirect to a thank you page

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
    res.json({ success: true, availableTimes });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Forget Password - Step 1: Request reset
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour expiration time
    await user.save();

    // Use an environment variable for the base URL to allow flexibility between dev and prod
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    // Setup transporter for email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // Use a proper email service (or a dedicated email service like SendGrid in production)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Send the reset link to the user's email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
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
              .logo {
                display: block;
                margin: 0 auto 20px;
                width: 150px; /* Adjust logo size as needed */
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
            <h1>Password Reset Request</h1>
            <p>You requested a password reset. Please click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset Your Password</a></p>
    
            <!-- Footer -->
            <footer>
              <p>This link will expire in 1 hour.</p>
              <p>If you did not request this change, please ignore this email.</p>
              <p>For any questions, contact our <a href="mailto:support@yourcompany.com">support team</a>.</p>
            </footer>
          </body>
        </html>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (err) {
    console.error(err); // Log the error for debugging purposes
    res.status(500).json({
      success: false,
      message: "Error processing request",
      error: err.message,
    });
  }
};

// Reset Password - Step 2: Reset password using the token
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  console.log(token);
  console.log(password);
  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }, // Check if the token is expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash the new password and save it
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password successfully reset" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error resetting password", error: err.message });
  }
};

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
  verifyEmail,
  rateDoctor,
  checkUserRating,
  getDocSlots,
  forgetPassword,
  resetPassword,
};
