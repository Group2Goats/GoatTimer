import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import "./Dashboard.css";
import Timer from "./Timer";

const Dashboard = () => {
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const groups = data?.user?.groups;
        if (Array.isArray(groups) && groups.length > 0) {
          // groups can be ids or populated objects
          const first = groups[0];
          setGroupId(typeof first === "string" ? first : first._id);
        }
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      localStorage.removeItem("userId");
      navigate("/");
    });
  }
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return <div className="user-layout">Loading...</div>;
  }

  const now = new Date();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dateString = `${dayNames[now.getDay()]} ${monthNames[now.getMonth()]} ${now.getDate()}`;

  const weeklyGoal = user?.weeklyGoalHours || 15;
  const hoursStudied = 11.25; // Placeholder until session tracking is built
  const progress =
    weeklyGoal > 0 ? Math.round((hoursStudied / weeklyGoal) * 100) : 0;

  return (
    <div className="user-layout">
      {}

      {}
      <div className="home-container">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-top">
              <p className="current-date">Tuesday Apr 28</p>
              <div className="dashboard-header-actions">
                {groupId ? (
                  <Link to={`/groups/${groupId}`} className="profile-btn">
                    View Group
                  </Link>
                ) : (
                  <Link to="/create-group" className="profile-btn">
                    Create Group
                  </Link>
                )}
                <Link to="/profile" className="profile-btn">
                  Profile
                </Link>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              <p className="current-date">{dateString}</p>
              <Link to="/profile" className="profile-btn">
                Profile
              </Link>
            </div>
            <h1 className="greeting-text">
              Good morning, {user?.name || "G.O.A.T"}
            </h1>
          </header>

          <section className="progress-card">
            <div className="progress-header">
              <span>This week</span>
              <span className="progress-hours">
                <strong>
                  {hoursStudied}/{weeklyGoal}
                </strong>{" "}
                hours
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-percentage">{progress}%</div>
          </section>

          <Timer />
        </main>

        <aside className="dashboard-sidebar">
          <div className="leaderboard-card">
            <h3 className="leaderboard-title">Top Globally this week</h3>
            <ul className="leaderboard-list">
              <li className="leaderboard-item">
                <span className="rank-badge rank-top">1</span>
                <span className="player-name">Afredo</span>
                <span className="player-score">100h</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank-badge">2</span>
                <span className="player-name">Adrian</span>
                <span className="player-score">99h</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank-badge">3</span>
                <span className="player-name">Bryan</span>
                <span className="player-score">98h</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank-badge">4</span>
                <span className="player-name">Aras</span>
                <span className="player-score">97h</span>
              </li>
              <li className="leaderboard-item">
                <span className="rank-badge">5</span>
                <span className="player-name">Tan</span>
                <span className="player-score">67h</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
