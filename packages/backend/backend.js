import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./config/database.js";
import { PORT, IS_PRODUCTION } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import groupRoutes from "./routes/groups.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: IS_PRODUCTION
      ? "https://delightful-coast-0576a6c10.7.azurestaticapps.net"
      : [
          "http://localhost:5173",
          "http://localhost:5050",
          "http://127.0.0.1:5173",
        ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

//test server
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

//auth routes
app.use("/api/auth", authRoutes);

//user routes
app.use("/api/users", userRoutes);

//group routes
app.use("/api/groups", groupRoutes);

//connect and start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
