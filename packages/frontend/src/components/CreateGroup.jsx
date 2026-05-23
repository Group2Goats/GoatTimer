import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./CreateGroup.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function getGroupProgress(group) {
  const hours = Number(group.hours || 0);
  const goal = Number(group.groupGoal || 0);

  if (goal <= 0) {
    return 0;
  }

  return Math.min(Math.round((hours / goal) * 100), 100);
}

function getId(value) {
  return typeof value === "string" ? value : value?._id;
}

function CreateGroup() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState(null);
  const [joinId, setJoinId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupGoal, setGroupGoal] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
    loadGroups();
  }, []);

  function loadGroups() {
    setLoadingGroups(true);
    setError("");

    fetch(`${AZURE_URL}/api/groups`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load groups");
        return res.json();
      })
      .then((data) => {
        setGroups(Array.isArray(data) ? data : []);
        setLoadingGroups(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoadingGroups(false);
      });
  }

  function isCurrentUserGroup(group) {
    if (!user) return false;

    const ownerId = getId(group.owner);
    const isOwner = ownerId === user._id;

    const isMember = Array.isArray(group.users)
      ? group.users.some((member) => getId(member) === user._id)
      : false;

    return isOwner || isMember;
  }

  function handleCreate() {
    if (!user) return;

    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: groupName.trim() || "Untitled Group",
        groupGoal: Number(groupGoal) || 0,
        hours: 0,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to create group");
        }

        return data;
      })
      .then((data) => {
        setGroupId(data._id);
        setGroupName("");
        setGroupGoal("");
        setMessage("Group created! Share your Group ID with friends.");
        loadGroups();
      })
      .catch((err) => setError(err.message));
  }

  function handleJoin() {
    if (!user || !joinId.trim()) return;

    setError("");
    setMessage("");

    fetch(`${AZURE_URL}/api/groups/${joinId.trim()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ addUsers: [user._id] }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Group not found or failed to join");
        }

        return data;
      })
      .then((data) => {
        setMessage("You joined the group!");
        setJoinId("");
        loadGroups();
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

  const visibleGroups = showAllGroups
    ? groups
    : groups.filter(isCurrentUserGroup);

  return (
    <div className="createGroupPage">
      <div className="createGroupContainer">
        <h1 className="createGroupTitle">Groups</h1>
        <p className="createGroupSubtitle">
          Create a group, join a group, or open one of your current groups.
        </p>

        <div className="createGroupCard">
          <h2 className="createGroupHeading">Create a Group</h2>

          <input
            className="joinInput createGroupInput"
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            className="joinInput createGroupInput"
            type="number"
            min="0"
            placeholder="Group goal in hours"
            value={groupGoal}
            onChange={(e) => setGroupGoal(e.target.value)}
          />

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

        <div className="createGroupCard">
          <div className="allGroupsHeader">
            <h2 className="createGroupHeading">
              {showAllGroups ? "All Groups" : "My Groups"}
            </h2>

            <button
              className="toggleGroupsBtn"
              onClick={() => setShowAllGroups((current) => !current)}
            >
              {showAllGroups ? "Show My Groups" : "See All Groups"}
            </button>
          </div>

          {loadingGroups ? (
            <p>Loading groups...</p>
          ) : visibleGroups.length === 0 ? (
            <p>
              {showAllGroups
                ? "No groups exist yet."
                : "You are not in any groups yet."}
            </p>
          ) : (
            <div className="allGroupsList">
              {visibleGroups.map((group) => {
                const progress = getGroupProgress(group);

                return (
                  <button
                    key={group._id}
                    className="groupListCard"
                    onClick={() => navigate(`/groups/${group._id}`)}
                  >
                    <div className="groupListHeader">
                      <strong>
                        {group.name || `Group #${group._id.slice(-4)}`}
                      </strong>
                      <span>{group.users?.length || 0} members</span>
                    </div>

                    <p className="groupListOwner">
                      Owner:{" "}
                      {group.owner?.name || group.owner?.email || "Unknown"}
                    </p>

                    <div className="groupProgressHeader">
                      <span>Progress</span>
                      <strong>
                        {group.hours || 0}/{group.groupGoal || 0} hours
                      </strong>
                    </div>

                    <div className="groupProgressTrack">
                      <div
                        className="groupProgressFill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>

                    <div className="groupProgressPercent">{progress}%</div>
                  </button>
                );
              })}
            </div>
          )}
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
