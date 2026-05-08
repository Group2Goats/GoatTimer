import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";
import Group from "./models/group.js";

dotenv.config();

const app = express();
app.use(express.json());

// User fields that can be updated
const allowedUserUpdateFields = [
  "email",
  "firstName",
  "isAdmin",
  "totalHours",
  "goal",
  "weeklyHours",
  "age",
];

// Group fields that can be updated
const allowedGroupUpdateFields = ["owner", "users", "goal", "hours"];

// Gets only the fields that are allowed to update
function getAllowedUpdates(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
}

// Checks if a duplicate unique field was used
function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

// Makes the duplicate error easier to read
function getDuplicateKeyMessage(error) {
  const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
  return `${field} already exists`;
}

// Sends error messages to the frontend
function sendError(res, error, defaultStatus = 500) {
  if (isDuplicateKeyError(error)) {
    return res.status(409).json({ error: getDuplicateKeyMessage(error) });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(defaultStatus).json({ error: error.message });
}

// Connect to MongoDB
async function connectDB() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database successfully");
  } catch (error) {
    console.error("Connected to database failed:", error.message);
    process.exit(1);
  }
}

connectDB();

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
});

// Create a user
app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    sendError(res, error, 400);
  }
});

// Get all groups for one user
app.get("/api/users/:userId/groups", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const groups = await Group.find({
      $or: [{ owner: userId }, { users: userId }],
    })
      .populate("owner")
      .populate("users")
      .sort({ createdAt: -1 });

    return res.json(groups);
  } catch (error) {
    return sendError(res, error);
  }
});

// Get one user by route param. The param may be a MongoDB id or email.
app.get("/api/users/:userParam", async (req, res) => {
  try {
    const userParam = req.params.userParam.toLowerCase();

    const filter = mongoose.Types.ObjectId.isValid(userParam)
      ? { _id: userParam }
      : { email: userParam };

    const user = await User.findOne(filter);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error);
  }
});

// Update user information
app.put("/api/users/:userParam", async (req, res) => {
  try {
    const updates = getAllowedUpdates(req.body, allowedUserUpdateFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `At least one valid field is required: ${allowedUserUpdateFields.join(", ")}`,
      });
    }

    const userParam = req.params.userParam.toLowerCase();

    const filter = mongoose.Types.ObjectId.isValid(userParam)
      ? { _id: userParam }
      : { email: userParam };

    const user = await User.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

// Get all groups
app.get("/api/groups", async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("owner")
      .populate("users")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    sendError(res, error);
  }
});

// Create a group
app.post("/api/groups", async (req, res) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (error) {
    sendError(res, error, 400);
  }
});

// Get one group by id
app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupId)
      .populate("owner")
      .populate("users");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    return sendError(res, error);
  }
});

// Update group information
app.put("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const updates = getAllowedUpdates(req.body, allowedGroupUpdateFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `At least one valid field is required: ${allowedGroupUpdateFields.join(", ")}`,
      });
    }

    const group = await Group.findByIdAndUpdate(groupId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("owner")
      .populate("users");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
