import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import "./Groups.css";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function getProgress(group) {
  const hours = Number(group.hours || 0);
  const goal = Number(group.groupGoal || 0);

  if (goal <= 0) {
    return 0;
  }

  return Math.min(Math.round((hours / goal) * 100), 100);
}

function Groups() {
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await fetch(`${AZURE_URL}/api/groups`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Could not load groups");
        }

        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      }
    }

    loadGroups();
  }, []);

  return (
    <div className="groupsPage">
      <div className="groupsContainer">
        <div className="groupsHeader">
          <div>
            <h1 className="groupsTitle">Groups</h1>
            <p className="groupsSubtitle">View group members and goals.</p>
          </div>

          <button className="groupsButton" onClick={() => navigate("/groups")}>
            Create or Join Group
          </button>
        </div>

        {error && <p className="groupsError">{error}</p>}

        <div className="groupsGrid">
          {groups.map((group) => {
            const progress = getProgress(group);

            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="groupCardLink"
              >
                <article className="groupCard">
                  <div className="groupCardHeader">
                    <h2>{group.name || `Group #${group._id.slice(-4)}`}</h2>
                    <span>{group.users?.length || 0} members</span>
                  </div>

                  <p className="groupOwner">
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
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Groups;
