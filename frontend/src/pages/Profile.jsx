import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    room_no: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setError("");
      const res = await api.get("/users/me");
      setForm({
        name: res.data.name || "",
        email: res.data.email || "",
        contact: res.data.contact || "",
        room_no: res.data.room_no || "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load profile");
    }
  }

  async function save() {
    try {
      setSaving(true);
      setMsg("");
      setError("");

      const payload = {
        name: form.name,
        contact: form.contact,
        room_no: form.room_no,
      };

      const res = await api.put("/users/me", payload);

      const updatedUser = res.data.user;

      localStorage.setItem("user_name", updatedUser.name);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setForm((prev) => ({
        ...prev,
        name: updatedUser.name || "",
        contact: updatedUser.contact || "",
        room_no: updatedUser.room_no || "",
      }));

      setMsg("Profile updated successfully ✅");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2>Profile</h2>

      {msg && <div className="badge">{msg}</div>}
      {error && <div className="badge" style={{ background: "#ef4444" }}>{error}</div>}

      <label className="muted">Name</label>
      <input
        className="input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <label className="muted">Email</label>
      <input
        className="input"
        value={form.email}
        disabled
      />

      <label className="muted">Contact</label>
      <input
        className="input"
        value={form.contact}
        onChange={(e) => setForm({ ...form, contact: e.target.value })}
      />

      <label className="muted">Room No</label>
      <input
        className="input"
        value={form.room_no}
        onChange={(e) => setForm({ ...form, room_no: e.target.value })}
      />

      <button className="btn btnBlue" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}