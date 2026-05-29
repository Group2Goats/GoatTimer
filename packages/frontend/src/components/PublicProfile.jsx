// Displays another user's public profile information.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import "./Profile.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${AZURE_URL}/api/users/${userId}/public`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load user profile");
        return res.json();
      })
      .then((data) => {
        setProfileUser(data.user);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <div className="profilePage">
        <p className="profileMessage">Loading...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profilePage">
        <div className="profileContainer">
          <div className="profileCard">
            <p className="profileMessage">
              {error || "Could not load user profile."}
            </p>

            <div className="profileButtons">
              <button
                className="profileButton profileLogout"
                onClick={() => navigate(-1)}
              >
                Back
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
            <div className="profileValue">{profileUser.name || "—"}</div>
          </div>

          <div className="profileRow">
            <label className="profileLabel">Total Hours:</label>
            <div className="profileValue">{profileUser.totalHours || 0}</div>
          </div>

          {profileUser.isProfilePublic ? (
            <>
              <div className="profileRow">
                <label className="profileLabel">Age:</label>
                <div className="profileValue">{profileUser.age || "—"}</div>
              </div>

              <div className="profileRow">
                <label className="profileLabel">Interests:</label>
                <div className="profileValue">
                  {profileUser.interests || "—"}
                </div>
              </div>
            </>
          ) : (
            <p className="profileMessage">
              This user has not made their age and interests public.
            </p>
          )}

          <div className="profileRow">
            <label className="profileLabel">ID:</label>
            <div className="profileValue">
              #{profileUser._id ? profileUser._id.slice(-4) : "—"}
            </div>
          </div>

          <div className="profileButtons">
            <button
              className="profileButton profileLogout"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;
