import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import { PORT } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

const app = express();

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
