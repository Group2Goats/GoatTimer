// Displays the user profile, logout, deletion, and profile viewability settings.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./Profile.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

const PROFILE_VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
  },
  {
    value: "groups",
    label: "People in my groups",
  },
  {
    value: "private",
    label: "Private",
  },
];

function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    age: "",
    interests: "",
    profileVisibility: "private",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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
        setForm({
          age: data.user.age || "",
          interests: data.user.interests || "",
          profileVisibility:
            data.user.profileVisibility ||
            (data.user.isProfilePublic ? "public" : "private"),
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleSaveProfile() {
    if (!user) return;

    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/users/${user._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        age: form.age ? Number(form.age) : undefined,
        interests: form.interests,
        profileVisibility: form.profileVisibility,
        isProfilePublic: form.profileVisibility === "public",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update profile");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setMessage("Profile updated.");
      })
      .catch((err) => setError(err.message));
  }

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

  if (error && !user) {
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
            <input
              className="profileValue profileInput"
              type="number"
              min="0"
              value={form.age}
              onChange={(e) =>
                setForm((current) => ({ ...current, age: e.target.value }))
              }
            />
          </div>

          <div className="profileRow">
            <label className="profileLabel">Interests:</label>
            <input
              className="profileValue profileInput"
              type="text"
              value={form.interests}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  interests: e.target.value,
                }))
              }
            />
          </div>

          <div className="profileRow">
            <label className="profileLabel">ID:</label>
            <div className="profileValue">
              #{user._id ? user._id.slice(-4) : "—"}
            </div>
          </div>

          <div className="profileVisibilitySection">
            <h2 className="profileVisibilityTitle">Profile Viewability</h2>

            <div className="profileVisibilityOptions">
              {PROFILE_VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`profileVisibilityBtn ${
                    form.profileVisibility === option.value
                      ? "profileVisibilityBtnSelected"
                      : ""
                  }`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      profileVisibility: option.value,
                    }))
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {message && <p className="profileMessage">{message}</p>}
          {error && <p className="profileMessage">{error}</p>}

          <div className="profileButtons">
            <button
              className="profileButton profileSave"
              onClick={handleSaveProfile}
            >
              Save
            </button>

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
