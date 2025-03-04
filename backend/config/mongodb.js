import mongoose from "mongoose";

const connectDB = async () => {
  // Set 'strictQuery' to false to suppress the deprecation warning
  mongoose.set("strictQuery", false);

  mongoose.connection.on("connected", () => console.log("Database connected"));
  await mongoose.connect(
    `${process.env.MONGODB_URL || "mongodb://127.0.0.1:27017"}/HealthHub-gitHub`
  );
};

export default connectDB;
