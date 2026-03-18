import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    room_no: "",
    otp: ""
  });

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [otpMsg, setOtpMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  async function handleSendOtp() {
    setErr("");
    setMsg("");
    setOtpMsg("");

    if (!form.email.trim()) {
      setErr("Please enter email first");
      return;
    }

    try {
      setOtpLoading(true);

      const res = await api.post("/auth/send-otp", {
        email: form.email.trim().toLowerCase()
      });

      setOtpMsg(res.data?.message || "OTP sent successfully");
    } catch (e) {
      console.error("SEND OTP ERROR:", e);
      setErr(
        e?.response?.data?.error ||
        e?.message ||
        "Failed to send OTP"
      );
    } finally {
      setOtpLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        contact: form.contact.trim(),
        room_no: form.room_no.trim(),
        otp: form.otp.trim()
      };

      const res = await api.post("/auth/register", payload);

      setMsg(res.data?.message || "Registered successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        contact: "",
        room_no: "",
        otp: ""
      });

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (e) {
      console.error("REGISTER ERROR:", e);
      setErr(
        e?.response?.data?.error ||
        e?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <h1>Register</h1>

        {msg && <div className="badge">{msg}</div>}
        {otpMsg && <div className="badge" style={{ marginBottom: 10 }}>{otpMsg}</div>}
        {err && <div className="errorBox">{err}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          <label>Email</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email"
              required
              style={{ flex: 1, marginBottom: 0 }}
            />
            <button
              type="button"
              className="btn btnBlue"
              onClick={handleSendOtp}
              disabled={otpLoading}
            >
              {otpLoading ? "Sending..." : "Send OTP"}
            </button>
          </div>

          <label>OTP</label>
          <input
            className="input"
            value={form.otp}
            onChange={(e) => setForm({ ...form, otp: e.target.value })}
            placeholder="Enter 6-digit OTP"
            required
          />

          <label>Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
            required
          />

          <label>Contact Number</label>
          <input
            className="input"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="Enter contact number"
          />

          <label>Room No</label>
          <input
            className="input"
            value={form.room_no}
            onChange={(e) => setForm({ ...form, room_no: e.target.value })}
            placeholder="Enter room number"
          />

          <button className="btn btnBlue" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}