import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/database.js";
import { PORT, IS_PRODUCTION } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

const app = express();

// CORS configuration - allow credentials and frontend origin
app.use(
  cors({
    origin: IS_PRODUCTION
      ? "https://yourproductiondomain.com" // update this for production
      : ["http://localhost:5173", "http://localhost:5050", "http://127.0.0.1:5173"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
