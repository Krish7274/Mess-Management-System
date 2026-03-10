import { useState } from "react";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    room_no: ""
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!form.name || !form.email || !form.password) {
      setErr("Name, Email and Password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        ...form,
        role: "User"
      });

      setMsg(res.data?.message || "Registered successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        contact: "",
        room_no: ""
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (e2) {
      setErr(e2?.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 900, margin: "0 auto", paddingTop: 60 }}>
      <div className="grid">
        <div className="card">
          <span className="badge">New User Registration</span>
          <h1>Create Account</h1>
          <p className="muted">
            Register with your own email and password to use the Mess Management System.
          </p>
          <p className="muted">
            After registration, you can login from the login page.
          </p>
        </div>

        <form className="card" onSubmit={handleSubmit}>
          <h2>Register</h2>

          {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
          {err && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>
              {err}
            </div>
          )}

          <label className="muted">Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your full name"
          />

          <label className="muted">Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter your email"
          />

          <label className="muted">Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
          />

          <label className="muted">Contact Number</label>
          <input
            className="input"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="Enter contact number"
          />

          <label className="muted">Room No</label>
          <input
            className="input"
            value={form.room_no}
            onChange={(e) => setForm({ ...form, room_no: e.target.value })}
            placeholder="Enter room number"
          />

          <div className="row" style={{ justifyContent: "space-between" }}>
            <a href="/login">Already have an account? Login</a>
            <button className="btn btnBlue" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}