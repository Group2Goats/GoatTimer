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
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLetsGo = async () => {
    setError("");

    try {
      const res = await fetch("/api/users/me/commitment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commitmentLevel: selected }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          navigate("/login");
          return;
        }

        const data = await res.json();
        setError(data.error || "Could not save commitment level");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Could not connect to server");
    }
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

      {error && <p className="committed-error">{error}</p>}

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
