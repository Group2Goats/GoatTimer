// Displays the user profile, logout, deletion, profile viewability, interests, and feature controls.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./Profile.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 24;

const PROFILE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "groups", label: "People in my groups" },
  { value: "private", label: "Private" },
];

function normalizeInterests(interests) {
  if (Array.isArray(interests)) {
    return interests.filter(Boolean);
  }

  if (typeof interests === "string" && interests.trim()) {
    return interests
      .split(",")
      .map((interest) => interest.trim())
      .filter(Boolean);
  }

  return [];
}

function cleanInterest(value) {
  return value.trim().replace(/\s+/g, " ");
}

function getInterestError(value, currentInterests) {
  const cleaned = cleanInterest(value);

  if (!cleaned) {
    return "Interest cannot be empty";
  }

  if (cleaned.length > MAX_INTEREST_LENGTH) {
    return `Interest must be ${MAX_INTEREST_LENGTH} characters or less`;
  }

  if (!/^[a-zA-Z0-9 '&-]+$/.test(cleaned)) {
    return "Only letters, numbers, spaces, apostrophes, ampersands, and hyphens are allowed";
  }

  if (currentInterests.length >= MAX_INTERESTS) {
    return `You can only add up to ${MAX_INTERESTS} interests`;
  }

  if (
    currentInterests.some(
      (interest) => interest.toLowerCase() === cleaned.toLowerCase(),
    )
  ) {
    return "That interest is already added";
  }

  return "";
}

function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    interests: [],
    profileVisibility: "private",
    featureSettings: {
      groupsEnabled: true,
      leaderboardEnabled: true,
    },
  });
  const [interestInput, setInterestInput] = useState("");
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
          name: data.user.name || "",
          age: data.user.age || "",
          interests: normalizeInterests(data.user.interests),
          profileVisibility: data.user.profileVisibility || "private",
          featureSettings: {
            groupsEnabled: data.user.featureSettings?.groupsEnabled !== false,
            leaderboardEnabled:
              data.user.featureSettings?.leaderboardEnabled !== false,
          },
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  function handleAddInterest() {
    const cleaned = cleanInterest(interestInput);
    const validationError = getInterestError(cleaned, form.interests);

    if (validationError) {
      setError(validationError);
      setMessage("");
      return;
    }

    setForm((current) => ({
      ...current,
      interests: [...current.interests, cleaned],
    }));

    setInterestInput("");
    setError("");
  }

  function handleRemoveInterest(interestToRemove) {
    setForm((current) => ({
      ...current,
      interests: current.interests.filter(
        (interest) => interest !== interestToRemove,
      ),
    }));
  }

  function handleSaveProfile() {
    if (!user) return;

    setError("");
    setMessage("");

    const name = form.name.trim();

    if (!name) {
      setError("Username is required");
      return;
    }

    fetch(`${AZURE_URL}/api/users/${user._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        age: form.age === "" ? null : Number(form.age),
        interests: form.interests,
        profileVisibility: form.profileVisibility,
        featureSettings: form.featureSettings,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update profile");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setForm((current) => ({
          ...current,
          name: data.name || "",
          age: data.age || "",
          interests: normalizeInterests(data.interests),
          profileVisibility: data.profileVisibility || "private",
          featureSettings: {
            groupsEnabled: data.featureSettings?.groupsEnabled !== false,
            leaderboardEnabled:
              data.featureSettings?.leaderboardEnabled !== false,
          },
        }));
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
            <label className="profileLabel" htmlFor="profile-name">
              Username:
            </label>
            <input
              id="profile-name"
              className="profileValue profileInput"
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({ ...current, name: e.target.value }))
              }
            />
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
            <label className="profileLabel">ID:</label>
            <div className="profileValue">{user._id || "—"}</div>
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

          <div className="profileVisibilitySection">
            <h2 className="profileVisibilityTitle">Feature Controls</h2>
            <p className="profileVisibilityHelp">
              Enable or disable features for your account.
            </p>

            <div className="profileVisibilityOptions">
              <button
                type="button"
                className={`profileVisibilityBtn ${
                  form.featureSettings.groupsEnabled
                    ? "profileVisibilityBtnSelected"
                    : ""
                }`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    featureSettings: {
                      ...current.featureSettings,
                      groupsEnabled: !current.featureSettings.groupsEnabled,
                    },
                  }))
                }
              >
                Groups:{" "}
                {form.featureSettings.groupsEnabled ? "Enabled" : "Disabled"}
              </button>

              <button
                type="button"
                className={`profileVisibilityBtn ${
                  form.featureSettings.leaderboardEnabled
                    ? "profileVisibilityBtnSelected"
                    : ""
                }`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    featureSettings: {
                      ...current.featureSettings,
                      leaderboardEnabled:
                        !current.featureSettings.leaderboardEnabled,
                    },
                  }))
                }
              >
                Leaderboard:{" "}
                {form.featureSettings.leaderboardEnabled
                  ? "Enabled"
                  : "Disabled"}
              </button>
            </div>
          </div>

          <div className="profileInterestsSection">
            <h2 className="profileInterestsTitle">Interests</h2>

            <div className="profileInterestAddRow">
              <input
                className="profileValue profileInput profileInterestInput"
                type="text"
                maxLength={MAX_INTEREST_LENGTH}
                placeholder="Add an interest"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
              />

              <button
                type="button"
                className="profileInterestAddBtn"
                onClick={handleAddInterest}
              >
                +
              </button>
            </div>

            <div className="profileInterestList">
              {form.interests.length === 0 ? (
                <p className="profileInterestEmpty">No interests added yet.</p>
              ) : (
                form.interests.map((interest) => (
                  <span className="profileInterestTag" key={interest}>
                    {interest}
                    <button
                      type="button"
                      className="profileInterestRemoveBtn"
                      onClick={() => handleRemoveInterest(interest)}
                      aria-label={`Remove ${interest}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
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
