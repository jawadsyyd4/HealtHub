import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    mongoose.connection.on("connected", () =>
      console.log("✅ Database connected to MongoDB Atlas")
    );

    await mongoose.connect(process.env.MONGODB_URL);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
