import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./Profile.css";

const fallbackUser = {
  name: "The Goat",
  email: "goat@school.edu",
  age: "18",
  group: "Cal Poly",
  interests: "Programming",
  _id: "abc1234",
};

function Profile() {
  const [user, setUser] = useState(fallbackUser);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    fetch(`/api/users/${userId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        // keep fallback data
      });
  }, []);

  function handleLogout() {
    localStorage.removeItem("userId");
    navigate("/login");
  }

  function handleDelete() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone.",
    );
    if (!confirmed) return;

    fetch(`/api/users/${userId}`, {
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

  return (
    <div className="profilePage">
      <div className="profileContainer">
        <div className="profileCard">
          <div className="profileRow">
            <label className="profileLabel">Name:</label>
            <div className="profileValue">{user.name || ""}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Email:</label>
            <div className="profileValue">{user.email || ""}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Age:</label>
            <div className="profileValue">{user.age || ""}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Group:</label>
            <div className="profileValue">{user.group || ""}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Interests:</label>
            <div className="profileValue">{user.interests || ""}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">ID:</label>
            <div className="profileValue">
              #{user._id ? user._id.slice(-4) : ""}
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
