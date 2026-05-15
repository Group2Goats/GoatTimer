import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./CreateGroup.css";

function CreateGroup() {
  const [user, setUser] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [joinId, setJoinId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => navigate("/login"));
  }, [navigate]);

  function handleCreate() {
    if (!user) return;
    setError("");
    setMessage("");

    fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create group");
        return res.json();
      })
      .then((data) => {
        setGroupId(data._id);
        setMessage("Group created! Share your Group ID with friends.");
      })
      .catch((err) => setError(err.message));
  }

  function handleJoin() {
    if (!user || !joinId.trim()) return;
    setError("");
    setMessage("");

    fetch(`/api/groups/${joinId.trim()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ addUsers: [user._id] }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Group not found or failed to join");
        return res.json();
      })
      .then((data) => {
        setMessage("You joined the group!");
        setJoinId("");
        navigate(`/groups/${data._id}`);
      })
      .catch((err) => setError(err.message));
  }

  function copyGroupId() {
    if (groupId) {
      navigator.clipboard.writeText(groupId);
      setMessage("Group ID copied to clipboard!");
    }
  }

  return (
    <div className="createGroupPage">
      <div className="createGroupContainer">
        <h1 className="createGroupTitle">Groups</h1>
        <p className="createGroupSubtitle">
          Create a group and share the ID with friends, or join one with their
          ID.
        </p>

        <div className="createGroupCard">
          <h2 className="createGroupHeading">Create a Group</h2>
          <button className="createGroupBtn" onClick={handleCreate}>
            Create Group
          </button>

          {groupId && (
            <div className="groupIdDisplay">
              <label className="groupIdLabel">Your Group ID:</label>
              <div className="groupIdRow">
                <span className="groupIdValue">{groupId}</span>
                <button className="copyBtn" onClick={copyGroupId}>
                  Copy
                </button>
              </div>
              <button
                className="createGroupBtn"
                style={{ marginTop: "12px" }}
                onClick={() => navigate(`/groups/${groupId}`)}
              >
                Manage Group
              </button>
            </div>
          )}
        </div>

        <div className="createGroupCard">
          <h2 className="createGroupHeading">Join a Group</h2>
          <div className="joinRow">
            <input
              className="joinInput"
              type="text"
              placeholder="Paste Group ID here"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
            />
            <button className="joinBtn" onClick={handleJoin}>
              Join
            </button>
          </div>
        </div>

        {message && <p className="createGroupMessage">{message}</p>}
        {error && <p className="createGroupError">{error}</p>}

        <button
          className="createGroupBack"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default CreateGroup;
