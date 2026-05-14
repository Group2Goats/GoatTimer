import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import User from "./models/user.js";
import Group from "./models/group.js";
import connectDB from "./config/database.js";
import { PORT, IS_PRODUCTION } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import requireAuth from "./middleware/requireAuth.js";

dotenv.config();

const app = express();

// cors
app.use(
  cors({
    origin: IS_PRODUCTION
      ? "https://yourproductiondomain.com"
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

// fields owner can edit
const allowedGroupUpdateFields = ["name", "groupGoal", "hours"];

function getAllowedUpdates(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function getDuplicateKeyMessage(error) {
  const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
  return `${field} already exists`;
}

function sendError(res, error, defaultStatus = 500) {
  if (isDuplicateKeyError(error)) {
    return res.status(409).json({ error: getDuplicateKeyMessage(error) });
  }

  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(defaultStatus).json({
    error: error?.message || "Something went wrong",
  });
}

function getUsersArray(users) {
  if (Array.isArray(users)) {
    return users;
  }

  if (!users) {
    return [];
  }

  return [users];
}

// test
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// auth routes
app.use("/api/auth", authRoutes);

// user routes
app.use("/api/users", userRoutes);

// list groups
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

// create group, requester is the owner
app.post("/api/groups", requireAuth, async (req, res) => {
  try {
    const { groupGoal = 0, hours = 0 } = req.body;
    const owner = req.auth.userId;
    const users = getUsersArray(req.body.users);

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Valid owner id is required" });
    }

    const ownerUser = await User.findById(owner);

    if (!ownerUser) {
      return res.status(404).json({ error: "Owner user not found" });
    }

    const groupUsers = [...new Set([owner, ...users].map(String))];

    const group = await Group.create({
      owner,
      users: groupUsers,
      groupGoal,
      hours,
    });

    await User.updateMany(
      { _id: { $in: groupUsers } },
      { $addToSet: { groups: group._id } },
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("owner")
      .populate("users");

    return res.status(201).json(populatedGroup);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

// get group by id
app.get("/api/groups/:groupParam", async (req, res) => {
  try {
    const { groupParam } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam)
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

// update group
// owner: edit name/goal/hours, remove any user
// non-owner: only allowed to add self (join)
app.put("/api/groups/:groupParam", requireAuth, async (req, res) => {
  try {
    const { groupParam } = req.params;
    const addUsers = getUsersArray(req.body.addUsers);
    const removeUsers = getUsersArray(req.body.removeUsers);
    const requesterId = req.auth.userId;

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const ownerId = group.owner.toString();
    const isOwner = ownerId === requesterId;

    const fieldUpdates = getAllowedUpdates(req.body, allowedGroupUpdateFields);
    const isFieldUpdate = Object.keys(fieldUpdates).length > 0;

    // non-owners can only add themselves (join)
    if (!isOwner) {
      if (isFieldUpdate || removeUsers.length > 0) {
        return res
          .status(403)
          .json({ error: "Only the group owner can do that" });
      }

      const onlyAddingSelf =
        addUsers.length === 1 && String(addUsers[0]) === requesterId;

      if (!onlyAddingSelf) {
        return res
          .status(403)
          .json({ error: "You can only add yourself to a group" });
      }
    }

    Object.assign(group, fieldUpdates);

    const invalidAddUsers = addUsers.filter(
      (userId) => !mongoose.Types.ObjectId.isValid(userId),
    );

    const invalidRemoveUsers = removeUsers.filter(
      (userId) => !mongoose.Types.ObjectId.isValid(userId),
    );

    if (invalidAddUsers.length > 0 || invalidRemoveUsers.length > 0) {
      return res.status(400).json({ error: "Invalid user id in request" });
    }

    const currentUsers = group.users.map((userId) => userId.toString());
    const usersToAdd = addUsers.map(String);
    const usersToRemove = removeUsers.map(String);

    const updatedUsers = [...new Set([...currentUsers, ...usersToAdd])];

    // owner cannot be removed
    group.users = updatedUsers.filter((userId) => {
      return userId === ownerId || !usersToRemove.includes(userId);
    });

    await group.save();

    await User.updateMany(
      { _id: { $in: usersToAdd } },
      { $addToSet: { groups: group._id } },
    );

    await User.updateMany(
      { _id: { $in: usersToRemove.filter((userId) => userId !== ownerId) } },
      { $pull: { groups: group._id } },
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("owner")
      .populate("users");

    return res.json(populatedGroup);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

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
