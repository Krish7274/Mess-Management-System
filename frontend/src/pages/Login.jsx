import { useState } from "react";
import api from "../api";
import { saveAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("admin@mess.com");
  const [password, setPassword] = useState("Admin@123");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!agree) {
      setErr("Accept Terms & Conditions");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      saveAuth(res.data);
      window.location.href = "/app";
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto", paddingTop: 60 }}>
      <div className="grid">
        <div className="card">
          <span className="badge">Blue + Red Theme</span>
          <h1>Mess Management</h1>
          <p className="muted">Login to manage menu, billing, inventory, complaints.</p>
          <p className="muted">
            <b>Demo Admin:</b> admin@mess.com / Admin@123
          </p>
        </div>

        <form className="card" onSubmit={submit}>
          <h2>Login</h2>

          {err && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>
              {err}
            </div>
          )}

          <label className="muted">Email</label>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="muted">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <label className="row">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span className="muted">I agree to Terms & Conditions</span>
          </label>

          <button className="btn btnBlue" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div style={{ marginTop: 12 }}>
            <a href="/register">New user? Register here</a>
          </div>
        </form>
      </div>
    </div>
  );
}