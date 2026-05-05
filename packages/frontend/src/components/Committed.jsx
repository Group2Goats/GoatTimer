import { useState } from "react";
import { useNavigate } from "react-router";
import "./Committed.css";

const TIERS = [
  {
    key: "low",
    label: "Low",
    hours: 70,
    daily: "around 10 hours/day",
  },
  {
    key: "medium",
    label: "Medium",
    hours: 105,
    daily: "around 15 hours/day",
  },
  {
    key: "hard",
    label: "Hard",
    hours: 140,
    daily: "around 20 hours/day",
  },
];

function Committed() {
  const [selected, setSelected] = useState("medium");
  const navigate = useNavigate();

  const handleLetsGo = async () => {
    // In a full app this would PATCH the logged-in user's commitment.
    // For now we store the choice in localStorage and navigate forward.
    const userId = localStorage.getItem("userId");

    if (userId) {
      try {
        await fetch(`/api/users/${userId}/commitment`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commitmentLevel: selected }),
        });
      } catch {
        // Silently continue — the user can update later
      }
    }

    localStorage.setItem("commitmentLevel", selected);
    navigate("/dashboard");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="committed-page">
      <h1 className="committed-title">How committed are you?</h1>
      <p className="committed-subtitle">
        Pick a weekly study goal. You can change it any time
      </p>

      <div className="tier-cards">
        {TIERS.map((tier) => (
          <button
            key={tier.key}
            className={`tier-card ${selected === tier.key ? "tier-card--selected" : ""}`}
            onClick={() => setSelected(tier.key)}
            aria-pressed={selected === tier.key}
          >
            <span className="tier-label">{tier.label}</span>
            <span className="tier-hours">
              <strong>{tier.hours}</strong> hours
            </span>
            <span className="tier-daily">{tier.daily}</span>
          </button>
        ))}
      </div>

      <div className="committed-actions">
        <button className="btn-back" onClick={handleBack}>
          Back
        </button>
        <button className="btn-letsgo" onClick={handleLetsGo}>
          Let&#8217;s go
        </button>
      </div>
    </div>
  );
}

export default Committed;
