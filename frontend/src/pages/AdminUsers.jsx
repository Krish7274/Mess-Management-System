import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function AdminUsers() {
  const currentUser = getUser();
  const currentRole = currentUser?.role || localStorage.getItem("role") || "User";

  const canAddUsers = currentRole === "Admin" || currentRole === "Staff";
  const canChangeRole = currentRole === "Admin";
  const canDeleteUsers = currentRole === "Admin";

  const roleOptionsForCreate = useMemo(() => {
    if (currentRole === "Admin") return ["User", "Staff", "Admin"];
    if (currentRole === "Staff") return ["User"];
    return [];
  }, [currentRole]);

  const [users, setUsers] = useState([]);
  const [draftRoles, setDraftRoles] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: roleOptionsForCreate[0] || "User",
    contact: "",
    room_no: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      role: roleOptionsForCreate[0] || "User",
    }));
  }, [roleOptionsForCreate]);

  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(() => setMsg(""), 2500);
    return () => clearTimeout(timer);
  }, [msg]);

  useEffect(() => {
    if (!err) return;
    const timer = setTimeout(() => setErr(""), 3000);
    return () => clearTimeout(timer);
  }, [err]);

  async function loadUsers() {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get("/users");
      const loadedUsers = res.data || [];
      setUsers(loadedUsers);

      const initialDrafts = {};
      loadedUsers.forEach((u) => {
        initialDrafts[u.id] = u.role;
      });
      setDraftRoles(initialDrafts);
    } catch (e) {
      console.error("LOAD USERS ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUser(e) {
    e.preventDefault();

    try {
      setErr("");
      setMsg("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        contact: form.contact.trim(),
        room_no: form.room_no.trim(),
      };

      const res = await api.post("/users", payload);
      setMsg(res.data?.message || "User added successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        role: roleOptionsForCreate[0] || "User",
        contact: "",
        room_no: "",
      });

      loadUsers();
    } catch (e) {
      console.error("ADD USER ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to add user");
    }
  }

  async function changeRole(userId) {
    try {
      setErr("");
      setMsg("");

      const newRole = draftRoles[userId];
      const targetUser = users.find((u) => u.id === userId);

      if (!targetUser) {
        setErr("User not found");
        return;
      }

      if (targetUser.role === newRole) {
        setMsg("No role change needed");
        return;
      }

      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      setMsg(res.data?.message || "Role updated successfully");

      await loadUsers();
    } catch (e) {
      console.error("CHANGE ROLE ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to update role");
    }
  }

  async function deleteUser(userId, userName, userRole) {
    const ok = window.confirm(`Are you sure you want to delete ${userRole} "${userName}"?`);
    if (!ok) return;

    try {
      setErr("");
      setMsg("");

      const res = await api.delete(`/users/${userId}`);
      setMsg(res.data?.message || "User deleted successfully");

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setDraftRoles((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } catch (e) {
      console.error("DELETE USER ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to delete user");
    }
  }

  useEffect(() => {
    if (canAddUsers) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  if (!canAddUsers) {
    return (
      <div className="card">
        <h1>Manage Users</h1>
        <div className="errorBox">You do not have permission to access this page.</div>
      </div>
    );
  }

  const adminUsers = users
    .filter((u) => u.role === "Admin")
    .sort((a, b) => a.id - b.id);

  const otherUsers = users
    .filter((u) => u.role !== "Admin")
    .sort((a, b) => a.id - b.id);

  return (
    <>
      {msg && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9999,
            background: "#dcfce7",
            color: "#166534",
            border: "1px solid #86efac",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxWidth: "320px",
          }}
        >
          {msg}
        </div>
      )}

      {err && (
        <div
          style={{
            position: "fixed",
            top: msg ? "130px" : "80px",
            right: "20px",
            zIndex: 9999,
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            padding: "10px 14px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxWidth: "320px",
          }}
        >
          {err}
        </div>
      )}

      <div className="grid" style={{ gap: "24px" }}>
        <div className="card">
          <h2>Add User</h2>

          <form
            onSubmit={handleAddUser}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label className="muted">Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>

            <div>
              <label className="muted">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="muted">Password</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="muted">Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roleOptionsForCreate.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="muted">Contact</label>
              <input
                className="input"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Enter contact"
              />
            </div>

            <div>
              <label className="muted">Room No</label>
              <input
                className="input"
                value={form.room_no}
                onChange={(e) => setForm({ ...form, room_no: e.target.value })}
                placeholder="Enter room number"
              />
            </div>

            <div>
              <button className="btn btnBlue" type="submit" style={{ width: "100%" }}>
                Add User
              </button>
            </div>
          </form>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <div className="card">
            <h2>Users / Staff</h2>

            {loading ? (
              <p className="muted">Loading...</p>
            ) : otherUsers.length === 0 ? (
              <p className="muted">No users or staff found</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Contact</th>
                      <th style={thStyle}>Room No</th>
                      <th style={thStyle}>Assign Role</th>
                      <th style={thStyle}>Update</th>
                      <th style={thStyle}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherUsers.map((u, index) => (
                      <tr
                        key={u.id}
                        style={{
                          background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>{u.name}</td>
                        <td style={tdStyle}>{u.email}</td>
                        <td style={tdStyle}>{u.contact || "-"}</td>
                        <td style={tdStyle}>{u.room_no || "-"}</td>
                        <td style={tdStyle}>
                          {canChangeRole ? (
                            <select
                              className="input"
                              value={draftRoles[u.id] || u.role}
                              onChange={(e) =>
                                setDraftRoles((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.value,
                                }))
                              }
                              style={{ minWidth: "140px" }}
                            >
                              <option value="User">User</option>
                              <option value="Staff">Staff</option>
                              <option value="Admin">Admin</option>
                            </select>
                          ) : (
                            <input
                              className="input"
                              value={u.role}
                              disabled
                              style={{ minWidth: "140px" }}
                            />
                          )}
                        </td>
                        <td style={tdStyle}>
                          {canChangeRole ? (
                            <button
                              className="btn btnBlue"
                              onClick={() => changeRole(u.id)}
                            >
                              Update
                            </button>
                          ) : (
                            <span className="muted">No permission</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {canDeleteUsers ? (
                            <button
                              className="btn btnRed"
                              onClick={() => deleteUser(u.id, u.name, u.role)}
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="muted">No permission</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Admins</h2>

            {loading ? (
              <p className="muted">Loading...</p>
            ) : adminUsers.length === 0 ? (
              <p className="muted">No admins found</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "420px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u, index) => (
                      <tr
                        key={u.id}
                        style={{
                          background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>{u.name}</td>
                        <td style={tdStyle}>
                          {canChangeRole ? (
                            <select
                              className="input"
                              value={draftRoles[u.id] || u.role}
                              onChange={(e) =>
                                setDraftRoles((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.value,
                                }))
                              }
                              style={{ minWidth: "130px" }}
                            >
                              <option value="Admin">Admin</option>
                              <option value="Staff">Staff</option>
                              <option value="User">User</option>
                            </select>
                          ) : (
                            <input
                              className="input"
                              value={u.role}
                              disabled
                              style={{ minWidth: "120px" }}
                            />
                          )}
                        </td>
                        <td style={tdStyle}>
                          {canChangeRole ? (
                            <button
                              className="btn btnBlue"
                              onClick={() => changeRole(u.id)}
                            >
                              Update
                            </button>
                          ) : (
                            <span className="muted">No permission</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            After role is changed, that user must logout and login again to get the new permissions.
          </p>
        </div>
      </div>
    </>
  );
}

const thStyle = {
  border: "1px solid #d1d5db",
  padding: "12px",
  textAlign: "left",
  background: "#f1f5f9",
  fontWeight: "700",
  fontSize: "14px",
};

const tdStyle = {
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  verticalAlign: "middle",
  fontSize: "14px",
};