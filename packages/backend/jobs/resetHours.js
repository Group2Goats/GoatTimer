import User from "../models/user.js";

// runs in unix/utc time so it's consistent no matter where the server lives
// daily reset clears todayHours every day at 00:00 utc
// weekly reset clears weeklyHours every monday at 00:00 utc

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

// next 00:00 utc
function msUntilNextDailyTick() {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.getTime() - now.getTime();
}

// next monday 00:00 utc (getUTCDay: 0=sun, 1=mon ... 6=sat)
function msUntilNextWeeklyTick() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilMon = (8 - day) % 7 || 7; // always at least 1 day ahead
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntilMon,
      0,
      0,
      0,
      0,
    ),
  );
  return next.getTime() - now.getTime();
}

async function resetDailyHours() {
  try {
    const result = await User.updateMany({}, { $set: { todayHours: 0 } });
    console.log(
      `[reset] daily todayHours cleared for ${result.modifiedCount} users`,
    );
  } catch (err) {
    console.error("[reset] daily reset failed:", err.message);
  }
}

async function resetWeeklyHours() {
  try {
    const result = await User.updateMany({}, { $set: { weeklyHours: 0 } });
    console.log(
      `[reset] weekly weeklyHours cleared for ${result.modifiedCount} users`,
    );
  } catch (err) {
    console.error("[reset] weekly reset failed:", err.message);
  }
}

// schedule a job to run at the next aligned tick, then every interval after
function scheduleAligned(initialDelayMs, intervalMs, fn) {
  setTimeout(() => {
    fn();
    setInterval(fn, intervalMs);
  }, initialDelayMs);
}

export function startResetJobs() {
  const dailyDelay = msUntilNextDailyTick();
  const weeklyDelay = msUntilNextWeeklyTick();

  scheduleAligned(dailyDelay, ONE_DAY_MS, resetDailyHours);
  scheduleAligned(weeklyDelay, ONE_WEEK_MS, resetWeeklyHours);

  console.log(
    `[reset] daily reset in ${Math.round(dailyDelay / 1000 / 60)} min, weekly reset in ${Math.round(weeklyDelay / 1000 / 60 / 60)} hr`,
  );
}

// exported for manual testing
export { resetDailyHours, resetWeeklyHours };
