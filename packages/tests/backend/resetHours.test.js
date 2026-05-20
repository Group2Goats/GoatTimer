// tests for the daily/weekly hour reset jobs
// fully mocked, no real db calls -- safe to run on every merge

import { describe, expect, it, vi, beforeEach } from "vitest";

// fake user "collection" -- we just check what gets called on it
const fakeUser = {
  updateMany: vi.fn(),
};

// mock the user model BEFORE we import the job module
vi.mock("@backend/models/user.js", () => ({
  default: fakeUser,
}));

const { resetDailyHours, resetWeeklyHours } = await import(
  "@backend/jobs/resetHours.js"
);

describe("resetHours jobs", () => {
  beforeEach(() => {
    fakeUser.updateMany.mockReset();
    fakeUser.updateMany.mockResolvedValue({ modifiedCount: 3 });
  });

  it("daily reset zeros todayHours for all users", async () => {
    await resetDailyHours();

    expect(fakeUser.updateMany).toHaveBeenCalledOnce();
    expect(fakeUser.updateMany).toHaveBeenCalledWith(
      {},
      { $set: { todayHours: 0 } },
    );
  });

  it("weekly reset zeros weeklyHours for all users", async () => {
    await resetWeeklyHours();

    expect(fakeUser.updateMany).toHaveBeenCalledOnce();
    expect(fakeUser.updateMany).toHaveBeenCalledWith(
      {},
      { $set: { weeklyHours: 0 } },
    );
  });

  it("daily reset doesnt blow up if db throws", async () => {
    fakeUser.updateMany.mockRejectedValueOnce(new Error("db down"));
    // shouldnt throw -- it just logs
    await expect(resetDailyHours()).resolves.toBeUndefined();
  });

  it("weekly reset doesnt blow up if db throws", async () => {
    fakeUser.updateMany.mockRejectedValueOnce(new Error("db down"));
    await expect(resetWeeklyHours()).resolves.toBeUndefined();
  });
});
