//navbar for logged in user
import React from "react";
import { Link, useLocation } from "react-router";
import "./UserHome.css";

function UserNavbar() {
  const location = useLocation();

  return (
    <nav className="nav-container">
      <div className="nav-logo">GoatTimer</div>
      <ul className="nav-links">
        <li>
          <Link
            to="/userhome"
            className={`nav-link ${location.pathname === "/userhome" || location.pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/leaderboard"
            className={`nav-link ${location.pathname === "/leaderboard" ? "active" : ""}`}
          >
            Leaderboard
          </Link>
        </li>
        <li>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
          >
            Profile
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default UserNavbar;
