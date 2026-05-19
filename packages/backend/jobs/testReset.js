// quick manual test: run this to fire the reset jobs once and exit
// usage: node jobs/testReset.js          -> runs both
//        node jobs/testReset.js daily    -> runs only daily
//        node jobs/testReset.js weekly   -> runs only weekly

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { resetDailyHours, resetWeeklyHours } from "./resetHours.js";

dotenv.config();

async function main() {
  const which = process.argv[2];

  await connectDB();

  if (which === "daily") {
    await resetDailyHours();
  } else if (which === "weekly") {
    await resetWeeklyHours();
  } else {
    await resetDailyHours();
    await resetWeeklyHours();
  }

  await mongoose.disconnect();
  console.log("[reset] done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
