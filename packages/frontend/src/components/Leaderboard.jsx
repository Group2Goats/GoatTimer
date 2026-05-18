import { useEffect, useState } from "react";

const DEFAULT_LIMIT = 5;

function formatHours(hours) {
  const numericHours = Number(hours) || 0;
  const roundedHours = Math.round(numericHours * 10) / 10;

  return `${
    Number.isInteger(roundedHours) ? roundedHours : roundedHours.toFixed(1)
  }h`;
}

function Leaderboard({ groupId, limit = DEFAULT_LIMIT, user }) {
  const [scope, setScope] = useState("global");
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const isGroupUnavailable = scope === "group" && !groupId;

  useEffect(() => {
    if (isGroupUnavailable) {
      return;
    }

    const controller = new AbortController();

    async function loadLeaderboard() {
      setStatus("loading");
      setError("");

      const params = new URLSearchParams({
        scope,
        limit: String(limit),
      });

      if (scope === "group") {
        params.set("groupId", groupId);
      }

      const res = await fetch(`/api/leaderboard?${params.toString()}`, {
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not load leaderboard");
      }

      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setStatus("success");
    }

    loadLeaderboard().catch((err) => {
      if (err.name === "AbortError") {
        return;
      }

      setEntries([]);
      setError(err.message);
      setStatus("error");
    });

    return () => controller.abort();
  }, [groupId, isGroupUnavailable, limit, scope]);

  const visibleEntries = isGroupUnavailable ? [] : entries;
  const visibleStatus = isGroupUnavailable ? "idle" : status;
  const hasEntries = visibleEntries.length > 0;

  let emptyMessage = "No study time yet. Start a session to claim a spot.";

  if (isGroupUnavailable) {
    emptyMessage = "Create or join a group to see your group leaderboard.";
  }

  const stats = [
    { label: "Today", value: formatHours(user?.todayHours) },
    { label: "This week", value: formatHours(user?.weeklyHours) },
    { label: "Total", value: formatHours(user?.totalHours) },
  ];

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">Leaderboard</h3>
        <div className="leaderboard-stats" aria-label="Your study statistics">
          {stats.map((stat) => (
            <div className="leaderboard-stat" key={stat.label}>
              <span className="leaderboard-stat-value">{stat.value}</span>
              <span className="leaderboard-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="leaderboard-tabs" aria-label="Leaderboard scope">
          <button
            className={`leaderboard-tab ${scope === "global" ? "active" : ""}`}
            type="button"
            aria-pressed={scope === "global"}
            onClick={() => setScope("global")}
          >
            Global
          </button>
          <button
            className={`leaderboard-tab ${scope === "group" ? "active" : ""}`}
            type="button"
            aria-pressed={scope === "group"}
            onClick={() => setScope("group")}
          >
            Group
          </button>
        </div>
        <p className="leaderboard-subtitle">
          {scope === "global" ? "Top global users" : "Top group users"}
        </p>
      </div>

      {visibleStatus === "loading" && (
        <p className="leaderboard-message">Loading leaderboard...</p>
      )}

      {visibleStatus === "error" && (
        <p className="leaderboard-message leaderboard-error">{error}</p>
      )}

      {visibleStatus !== "loading" &&
        visibleStatus !== "error" &&
        !hasEntries && <p className="leaderboard-message">{emptyMessage}</p>}

      {visibleStatus === "success" && hasEntries && (
        <ul className="leaderboard-list">
          {visibleEntries.map((entry) => (
            <li
              className={`leaderboard-item ${
                entry.isCurrentUser ? "current-user" : ""
              }`}
              key={entry.userId}
            >
              <span
                className={`rank-badge ${entry.rank === 1 ? "rank-top" : ""}`}
              >
                {entry.rank}
              </span>
              <span className="player-name">
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="current-user-label">You</span>
                )}
              </span>
              <span className="player-score">
                {formatHours(entry.weeklyHours)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Leaderboard;
