//loads and displays the global or group leaderboard with the current user's hours highlightedz
import { useEffect, useState } from "react";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";
const DEFAULT_LIMIT = 5;

function formatHours(hours) {
  const numericHours = Number(hours) || 0;
  const roundedHours = Math.round(numericHours * 10) / 10;

  return `${
    Number.isInteger(roundedHours) ? roundedHours : roundedHours.toFixed(1)
  }h`;
}

function Leaderboard({
  limit = DEFAULT_LIMIT,
  user,
  groupId,
  scope = "global",
}) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLeaderboard() {
      setStatus("loading");
      setError("");

      const params = new URLSearchParams({
        limit: String(limit),
        scope,
      });

      if (scope === "group" && groupId) {
        params.append("groupId", groupId);
      }

      const res = await fetch(
        `${AZURE_URL}/api/users/leaderboard?${params.toString()}`,
        {
          credentials: "include",
          signal: controller.signal,
        },
      );

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
  }, [limit, scope, groupId]);

  const hasEntries = entries.length > 0;
  const emptyMessage = "No study time yet. Start a session to claim a spot.";
  const subtitle = scope === "group" ? "Top group members" : "Top global users";
  const stats = [{ label: "All time", value: formatHours(user?.totalHours) }];

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
        <p className="leaderboard-subtitle">{subtitle}</p>
      </div>

      {status === "loading" && (
        <p className="leaderboard-message">Loading leaderboard...</p>
      )}

      {status === "error" && (
        <p className="leaderboard-message leaderboard-error">{error}</p>
      )}

      {status !== "loading" && status !== "error" && !hasEntries && (
        <p className="leaderboard-message">{emptyMessage}</p>
      )}

      {status === "success" && hasEntries && (
        <ul className="leaderboard-list">
          {entries.map((entry) => (
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
                {formatHours(entry.totalHours)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Leaderboard;
