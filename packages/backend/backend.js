import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const app = express();
app.use(express.json());

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully");
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}

connectDB();

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
