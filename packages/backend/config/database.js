//connects the backend server to MongoDB and exits if connection fails
import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to database successfully");
  } catch (error) {
    console.error("Connected to database failed:", error.message);
    process.exit(1);
  }
}

export default connectDB;
