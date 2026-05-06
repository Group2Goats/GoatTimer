import React from "react";
import UserNavbar from "./UserNavbar.jsx"; 
import "./UserHome.css";

const UserHome = () => {
  return (
    <div className="user-layout">
      {}
      <UserNavbar />

      {}
      <div className="home-container">
        <main className="dashboard-main">
          <header className="dashboard-header">
            <p className="current-date">Tuesday Apr 28</p>
            <h1 className="greeting-text">Good morning, Tan</h1>
          </header>

          <section className="progress-card">
            <div className="progress-header">
              <span>This week</span>
              <span className="progress-hours">
                <strong>11.25/15</strong> hours
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: "75%" }}></div>
            </div>
            <div className="progress-percentage">75%</div>
          </section>

          <section className="timer-card">
            <div className="timer-display">00:00</div>
            <button className="start-session-btn">Start session</button>
          </section>
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

export default UserHome;
