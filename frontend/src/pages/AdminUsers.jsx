import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function AdminUsers() {
  const currentUser = getUser();
  const isAdmin = currentUser?.role === "Admin";

  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function loadUsers() {
    setErr("");
    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load users");
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId, role) {
    setMsg("");
    setErr("");

    try {
      const res = await api.put(`/users/${userId}/role`, { role });
      setMsg(res.data?.message || "Role updated");
      loadUsers();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update role");
    }
  }

  const adminUsers = useMemo(
    () => users.filter((u) => u.role === "Admin"),
    [users]
  );

  const normalUsers = useMemo(
    () => users.filter((u) => u.role !== "Admin"),
    [users]
  );

  if (!isAdmin) {
    return (
      <div className="card">
        <h1>Manage Users & Roles</h1>
        <p className="muted">Only Admin can access this page.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "18px" }}>
      <div className="card">
        <h1>Manage Users & Roles</h1>

        {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && (
          <div
            className="card"
            style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}
          >
            {err}
          </div>
        )}

        <p className="muted">
          This page is divided into two sections: one for Admins and one for Users/Staff.
        </p>
      </div>

      {/* Admins Table */}
      <div className="card">
        <h2 style={{ marginBottom: 14 }}>Admins</h2>

        {adminUsers.length === 0 ? (
          <p className="muted">No admin users found</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Current Role</th>
                  <th style={thStyle}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <b style={{ color: "#60a5fa" }}>{u.role}</b>
                    </td>
                    <td style={tdStyle}>
                      <div className="row" style={{ flexWrap: "wrap" }}>
                        <button
                          className="btn btnBlue"
                          onClick={() => changeRole(u.id, "Admin")}
                        >
                          Keep Admin
                        </button>

                        <button
                          className="btn btnRed"
                          onClick={() => changeRole(u.id, "User")}
                        >
                          Make User
                        </button>

                        <button
                          className="btn btnBlue"
                          onClick={() => changeRole(u.id, "Staff")}
                        >
                          Make Staff
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users and Staff Table */}
      <div className="card">
        <h2 style={{ marginBottom: 14 }}>Users / Staff</h2>

        {normalUsers.length === 0 ? (
          <p className="muted">No users or staff found</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Current Role</th>
                  <th style={thStyle}>Change Role</th>
                </tr>
              </thead>
              <tbody>
                {normalUsers.map((u) => (
                  <tr key={u.id}>
                    <td style={tdStyle}>{u.name}</td>
                    <td style={tdStyle}>{u.email}</td>
                    <td style={tdStyle}>
                      <b style={{ color: u.role === "Staff" ? "#f59e0b" : "#f87171" }}>
                        {u.role}
                      </b>
                    </td>
                    <td style={tdStyle}>
                      <div className="row" style={{ flexWrap: "wrap" }}>
                        <button
                          className="btn btnBlue"
                          onClick={() => changeRole(u.id, "Admin")}
                        >
                          Make Admin
                        </button>

                        <button
                          className="btn btnRed"
                          onClick={() => changeRole(u.id, "User")}
                        >
                          Make User
                        </button>

                        <button
                          className="btn btnBlue"
                          onClick={() => changeRole(u.id, "Staff")}
                        >
                          Make Staff
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,.15)",
  fontSize: "16px"
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  verticalAlign: "top"
};