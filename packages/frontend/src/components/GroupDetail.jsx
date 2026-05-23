import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Leaderboard from "./Leaderboard";
import "./GroupDetail.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function getId(value) {
  return typeof value === "string" ? value : value?._id;
}

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${AZURE_URL}/api/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not logged in");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => navigate("/login"));
  }, [navigate]);

  useEffect(() => {
    fetch(`${AZURE_URL}/api/groups/${groupId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Group not found");
        return res.json();
      })
      .then((data) => {
        setGroup(data);
        setName(data.name || "");
      })
      .catch((err) => setError(err.message));
  }, [groupId]);

  function handleSaveName() {
    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update group name");
        return res.json();
      })
      .then((data) => {
        setGroup(data);
        setEditingName(false);
        setMessage("Group name updated.");
      })
      .catch((err) => setError(err.message));
  }

  function handleKick(userId) {
    if (!group || !user) return;

    const ownerId = getId(group.owner);
    const isOwner = ownerId === user._id;

    if (!isOwner) return;

    const confirmed = window.confirm("Remove this member from the group?");
    if (!confirmed) return;

    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/groups/${groupId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ removeUsers: [userId] }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to remove member");
        return res.json();
      })
      .then((data) => {
        setGroup(data);
        setMessage("Member removed.");
      })
      .catch((err) => setError(err.message));
  }

  function handleDeleteGroup() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this group? This cannot be undone.",
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/groups/${groupId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.error || `Failed to delete group. Status: ${res.status}`,
          );
        }

        return data;
      })
      .then(() => {
        navigate("/groups");
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  function copyGroupId() {
    navigator.clipboard.writeText(groupId);
    setMessage("Group ID copied to clipboard!");
  }

  if (!group || !user) {
    return (
      <div className="groupDetailPage">
        <p className="groupDetailMessage">
          {error ? `Error: ${error}` : "Loading..."}
        </p>
      </div>
    );
  }

  const ownerId = getId(group.owner);
  const isOwner = ownerId === user._id;
  const groupHours = Number(group.hours || 0);
  const groupGoal = Number(group.groupGoal || 0);
  const groupProgress =
    groupGoal > 0
      ? Math.min(Math.round((groupHours / groupGoal) * 100), 100)
      : 0;

  const members = Array.isArray(group.users) ? group.users : [];

  return (
    <div className="groupDetailPage">
      <div className="groupDetailContainer">
        <div className="groupDetailCard">
          <div className="groupNameRow">
            <div className="groupNameSpacer"></div>

            {editingName ? (
              <input
                className="groupNameInput"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            ) : (
              <h1 className="groupName">{group.name || "Untitled Group"}</h1>
            )}

            <div className="groupNameActions">
              {isOwner && editingName ? (
                <>
                  <button className="groupSaveBtn" onClick={handleSaveName}>
                    Save
                  </button>

                  <button
                    className="groupCancelBtn"
                    onClick={() => {
                      setName(group.name || "");
                      setEditingName(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                isOwner && (
                  <>
                    <button
                      className="groupEditBtn"
                      onClick={() => setEditingName(true)}
                    >
                      Edit
                    </button>

                    <button
                      className="groupDeleteTopBtn"
                      onClick={handleDeleteGroup}
                    >
                      Delete
                    </button>
                  </>
                )
              )}
            </div>
          </div>

          <div className="groupIdSection">
            <label className="groupSectionLabel">Group ID:</label>

            <div className="groupIdRow">
              <span className="groupIdValue">{group._id}</span>

              <button className="copyBtn" onClick={copyGroupId}>
                Copy
              </button>
            </div>
          </div>

          <div className="groupProgressSection">
            <div className="groupProgressHeader">
              <span>Group progress</span>

              <strong>
                {groupHours}/{groupGoal} hours
              </strong>
            </div>

            <div className="groupProgressTrack">
              <div
                className="groupProgressFill"
                style={{ width: `${groupProgress}%` }}
              ></div>
            </div>

            <div className="groupProgressPercent">{groupProgress}%</div>
          </div>

          <div className="groupMembersSection">
            <h2 className="groupSectionHeading">Members</h2>

            <ul className="groupMemberList">
              {members.map((member) => {
                const memberId = getId(member);
                const isLeader = memberId === ownerId;
                const isSelf = memberId === user._id;

                return (
                  <li key={memberId} className="groupMemberItem">
                    <span className="groupMemberName">
                      {member.name || member.email || memberId}
                    </span>

                    {isLeader && <span className="leaderBadge">Leader</span>}

                    {isOwner && !isLeader && (
                      <button
                        className="kickBtn"
                        onClick={() => handleKick(memberId)}
                      >
                        Kick
                      </button>
                    )}

                    {isSelf && !isLeader && (
                      <span className="selfBadge">You</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <Leaderboard groupId={groupId} scope="group" user={user} limit={5} />

          {message && <p className="groupDetailMessage">{message}</p>}
          {error && <p className="groupDetailError">{error}</p>}

          <div className="groupDetailActions">
            <button
              className="groupBackBtn"
              onClick={() => navigate("/groups")}
            >
              Back to Groups
            </button>

            <button
              className="groupBackBtn"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupDetail;
