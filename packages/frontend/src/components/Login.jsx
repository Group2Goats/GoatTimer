import { useState } from "react";
import { Link, useNavigate } from "react-router";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid email or password");
        return;
      }

      const { user } = await res.json();

      // If user hasn't picked a commitment level yet, send them there
      if (!user.commitmentLevel) {
        navigate("/committed");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Could not connect to server");
    }
  };

  return (
    <div className="login-page">
      <h1 className="login-title">Welcome G.O.A.T</h1>
      <p className="login-toggle">
        Don&rsquo;t have an account? <Link to="/signup">Create Account</Link>
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-label" htmlFor="login-email">
          Email
        </label>
        <input
          id="login-email"
          className="login-input"
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="login-label" htmlFor="login-password">
          Password
        </label>
        <input
          id="login-password"
          className="login-input"
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-error">{error}</p>}

        <button className="login-button" type="submit">
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;
