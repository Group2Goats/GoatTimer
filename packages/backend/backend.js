import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/database.js";
import { PORT, IS_PRODUCTION } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import groupRoutes from "./routes/groups.js";
import { leaderboardHandler } from "./routes/leaderboard.js";
import requireAuth from "./middleware/requireAuth.js";
import { startResetJobs } from "./jobs/resetHours.js";
import {
  apiLimiter,
  authLimiter,
  writeLimiter,
} from "./middleware/rateLimit.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "https://delightful-coast-0576a6c10.7.azurestaticapps.net",
  "http://localhost:5173",
  "http://localhost:5050",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.options(/.*/, cors());

app.use(express.json());
app.use(cookieParser());

// trust proxy so rate limiter sees real client ip behind azure
app.set("trust proxy", 1);

// general backstop on every /api request
app.use("/api", apiLimiter);

//test server
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

//auth routes -- strict limit on top of the api limit
app.use("/api/auth", authLimiter, authRoutes);

//leaderboard route
app.get("/api/users/leaderboard", requireAuth, leaderboardHandler);

//user routes -- write ops get the writeLimiter
app.use("/api/users", writeLimiter, userRoutes);

//group routes -- write ops get the writeLimiter
app.use("/api/groups", writeLimiter, groupRoutes);

//connect and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    // kick off daily/weekly hour resets (utc)
    startResetJobs();
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
