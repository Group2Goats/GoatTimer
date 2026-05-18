import mongoose from "mongoose";
import { MONGO_DB_NAME, MONGO_URI } from "./env.js";

async function connectDB() {
  try {
    await mongoose.connect(
      MONGO_URI,
      MONGO_DB_NAME ? { dbName: MONGO_DB_NAME } : undefined,
    );
    console.log(
      `Connected to database successfully (${mongoose.connection.name})`,
    );
  } catch (error) {
    console.error("Connected to database failed:", error.message);
    process.exit(1);
  }
}

export default connectDB;
