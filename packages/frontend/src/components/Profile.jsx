//displays the user profile, logout, deletion
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./Profile.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${AZURE_URL}/api/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  function handleDelete() {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;

    fetch(`${AZURE_URL}/api/users/${user._id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to delete account");
        localStorage.removeItem("userId");
        navigate("/");
      })
      .catch((err) => {
        alert("Error deleting account: " + err.message);
      });
  }

  if (loading) {
    return (
      <div className="profilePage">
        <p className="profileMessage">Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profilePage">
        <div className="profileContainer">
          <div className="profileCard">
            <p className="profileMessage">
              Could not load profile. Please log in again.
            </p>
            <div className="profileButtons">
              <button
                className="profileButton profileLogout"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profilePage">
      <div className="profileContainer">
        <div className="profileCard">
          <div className="profileRow">
            <label className="profileLabel">Name:</label>
            <div className="profileValue">{user.name || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Email:</label>
            <div className="profileValue">{user.email || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Age:</label>
            <div className="profileValue">{user.age || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Group:</label>
            <div className="profileValue">{user.group || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Interests:</label>
            <div className="profileValue">{user.interests || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">ID:</label>
            <div className="profileValue">
              #{user._id ? user._id.slice(-4) : "—"}
            </div>
          </div>

          <div className="profileButtons">
            <button
              className="profileButton profileLogout"
              onClick={handleLogout}
            >
              Logout
            </button>
            <button
              className="profileButton profileDelete"
              onClick={handleDelete}
            >
              Delete
              <br />
              Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
