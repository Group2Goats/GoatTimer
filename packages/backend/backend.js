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
  "name",
  "firstName",
  "goal",
  "schedule",
];

// Group fields that can be updated
const allowedGroupUpdateFields = ["groupGoal", "hours"];

// Gets only the fields that are allowed to update
function getAllowedUpdates(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
}

// Checks if username or email already exists
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

// Finds a user by id, username, or email
function getUserFilter(userParam) {
  const value = userParam.toLowerCase();

  if (mongoose.Types.ObjectId.isValid(value)) {
    return { _id: value };
  }

  return {
    $or: [{ username: value }, { email: value }],
  };
}

// Makes sure users is always an array
function getUsersArray(users) {
  if (Array.isArray(users)) {
    return users;
  }

  if (!users) {
    return [];
  }

  return [users];
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

// Test server
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Get all Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().populate("groups").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
});

// Post a User
app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    sendError(res, error, 400);
  }
});

// Get all groups for one user
app.get("/api/users/:userParam/groups", async (req, res) => {
  try {
    const user = await User.findOne(getUserFilter(req.params.userParam));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const groups = await Group.find({
      $or: [{ owner: user._id }, { users: user._id }],
    })
      .populate("owner")
      .populate("users")
      .sort({ createdAt: -1 });

    return res.json(groups);
  } catch (error) {
    return sendError(res, error);
  }
});

// Get 1 User by params
app.get("/api/users/:userParam", async (req, res) => {
  try {
    const user = await User.findOne(
      getUserFilter(req.params.userParam),
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error);
  }
});

// Update username, email, name, goal, and schedule
app.put("/api/users/:userParam", async (req, res) => {
  try {
    const updates = getAllowedUpdates(req.body, allowedUserUpdateFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `At least one valid field is required: ${allowedUserUpdateFields.join(", ")}`,
      });
    }

    const user = await User.findOneAndUpdate(
      getUserFilter(req.params.userParam),
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      },
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

// Get all Groups
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

// Post a group, person who created it should be the owner
app.post("/api/groups", async (req, res) => {
  try {
    const { owner, groupGoal = 0, hours = 0 } = req.body;
    const users = getUsersArray(req.body.users);

    if (!owner || !mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Valid owner id is required" });
    }

    const ownerUser = await User.findById(owner);

    if (!ownerUser) {
      return res.status(404).json({ error: "Owner user not found" });
    }

    // Owner is automatically added to the group users list
    const groupUsers = [...new Set([owner, ...users].map(String))];

    const group = await Group.create({
      owner,
      users: groupUsers,
      groupGoal,
      hours,
    });

    // Add this group to every user's groups array
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

// Get 1 group by params
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

// Update groupGoal and add/remove users
app.put("/api/groups/:groupParam", async (req, res) => {
  try {
    const { groupParam } = req.params;
    const addUsers = getUsersArray(req.body.addUsers);
    const removeUsers = getUsersArray(req.body.removeUsers);

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const updates = getAllowedUpdates(req.body, allowedGroupUpdateFields);

    Object.assign(group, updates);

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
    const ownerId = group.owner.toString();

    // Add users
    const updatedUsers = [...new Set([...currentUsers, ...usersToAdd])];

    // Remove users, but do not remove the owner
    group.users = updatedUsers.filter((userId) => {
      return userId === ownerId || !usersToRemove.includes(userId);
    });

    await group.save();

    // Add group id to users who were added
    await User.updateMany(
      { _id: { $in: usersToAdd } },
      { $addToSet: { groups: group._id } },
    );

    // Remove group id from users who were removed
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

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
