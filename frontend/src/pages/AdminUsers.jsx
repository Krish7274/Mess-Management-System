import { useEffect, useState } from "react";
import api from "../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setErr("");
      setLoading(true);

      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      console.error("LOAD USERS ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(userId, newRole) {
    try {
      setErr("");
      setMsg("");

      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      setMsg(res.data?.message || "Role updated");
      loadUsers();
    } catch (e) {
      console.error("CHANGE ROLE ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to update role");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const admins = users.filter((u) => u.role === "Admin");
  const userStaff = users.filter((u) => u.role !== "Admin");

  return (
    <div className="grid" style={{ gap: "24px" }}>
      <div className="card">
        <h1>Manage Users & Roles</h1>

        {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && <div className="errorBox" style={{ marginBottom: 12 }}>{err}</div>}

        <p className="muted">
          This page is divided into two sections: one for Admins and one for Users/Staff.
        </p>
      </div>

      <div className="card">
        <h2>Admins</h2>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="muted">No admin users found</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {admins.map((u) => (
              <div key={u.id} className="card" style={{ padding: "16px" }}>
                <p><b>{u.name}</b></p>
                <p className="muted">{u.email}</p>
                <p className="muted">Role: {u.role}</p>

                <div style={{ marginTop: 10 }}>
                  <select
                    className="input"
                    defaultValue={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Staff">Staff</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Users / Staff</h2>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : userStaff.length === 0 ? (
          <p className="muted">No users or staff found</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {userStaff.map((u) => (
              <div key={u.id} className="card" style={{ padding: "16px" }}>
                <p><b>{u.name}</b></p>
                <p className="muted">{u.email}</p>
                <p className="muted">Role: {u.role}</p>
                <p className="muted">Contact: {u.contact || "-"}</p>
                <p className="muted">Room: {u.room_no || "-"}</p>

                <div style={{ marginTop: 10 }}>
                  <select
                    className="input"
                    defaultValue={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="User">User</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}