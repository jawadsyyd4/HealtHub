import express from "express";
import cors from "cors";
import "dotenv/config.js";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import specialityRouter from "./routes/specialityRoute.js";
import cancelExpiredAppointments from "./jobs/appointmentCleaner.js";
import reactivateUnavailableDoctors from "./jobs/reactivateDoctors.js";

// app config
const app = express();

const PORT = process.env.PORT || 4000;

connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/speciality", specialityRouter);

cancelExpiredAppointments();
reactivateUnavailableDoctors();

app.get("/", (req, res) => {
  res.send("api working");
});

app.listen(PORT, () => {
  console.log(`Server started ${PORT}`);
});

app.use(
  cors({
    origin: [`${process.env.CLIENT_URL}`],
    credentials: true,
  })
);
