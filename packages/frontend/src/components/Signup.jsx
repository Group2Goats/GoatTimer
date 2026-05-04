import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./Signup.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email.split("@")[0],
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        return;
      }

      const user = await res.json();
      localStorage.setItem("userId", user._id);
      navigate("/committed");
    } catch {
      setError("Could not connect to server");
    }
  };

  return (
    <div className="signup-page">
      <h1 className="signup-title">Create your account</h1>
      <p className="signup-toggle">
        Already have one? <Link to="/login">Log in</Link>
      </p>

      <form className="signup-form" onSubmit={handleSubmit}>
        <label className="signup-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="signup-input"
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="signup-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          className="signup-input"
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="signup-label" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          className="signup-input"
          type="password"
          placeholder="••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="signup-error">{error}</p>}

        <button className="signup-button" type="submit">
          Create account
        </button>
      </form>
    </div>
  );
}

export default Signup;
