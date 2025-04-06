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

    // Correctly assign doctor data and ID
    const appointmentData = {
      userId,
      doctorId: docId, // Ensure docId is assigned to doctorId field
      doctorData: docData, // Ensure the complete doctor data is passed
      userData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    // Send verification email.
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: "Please confirm appointment",
      html: `<h1>Confirm your appointment</h1>
       <p>Your appointment is coming up on ${slotDate
         .split("_")
         .join("/")} at ${slotTime}</p>`,
    };

    // Create a new appointment
    const newAppointment = new appointmentModel(appointmentData);

    // Save the new appointment
    await newAppointment.save();

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
          "Appointment booked! Please check your email to confirm appointment.",
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  paymentStripepay,
  handlePaymentSuccess,
  verifyEmail,
  rateDoctor,
  checkUserRating,
  getDocSlots,
};
