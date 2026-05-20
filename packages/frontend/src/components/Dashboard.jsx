import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import "./Dashboard.css";
import Timer from "./Timer";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${AZURE_URL}/api/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        const groups = data.user?.groups;
        if (Array.isArray(groups) && groups.length > 0) {
          const first = groups[0];
          setGroupId(typeof first === "string" ? first : first._id);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    fetch(`${AZURE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      localStorage.removeItem("userId");
      navigate("/");
    });
  }

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

  const weeklyGoal = user?.goal || 15;
  const hoursStudied = user?.weeklyHours || 0;
  const progress =
    weeklyGoal > 0 ? Math.round((hoursStudied / weeklyGoal) * 100) : 0;

  return (
    <div className="user-layout">
      <div className="home-container">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-top">
              <p className="current-date">{dateString}</p>
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
                style={{ width: `${Math.min(progress, 100)}%` }}
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
