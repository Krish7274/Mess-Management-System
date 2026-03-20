import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

export default function AdminUsers() {
  const currentUser = getUser();
  const currentRole = currentUser?.role || "User";

  if (!["Admin", "Staff"].includes(currentRole)) {
    return <Navigate to="/app" replace />;
  }

  const canAddUsers = currentRole === "Admin" || currentRole === "Staff";
  const canChangeRole = currentRole === "Admin";
  const canDeleteUsers = currentRole === "Admin";

  const roleOptionsForCreate = useMemo(() => {
    if (currentRole === "Admin") return ["User", "Staff", "Admin"];
    if (currentRole === "Staff") return ["User"];
    return [];
  }, [currentRole]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: roleOptionsForCreate[0] || "User",
    room_no: "",
    contact: "",
  });

  const [draftRoles, setDraftRoles] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!roleOptionsForCreate.includes(form.role)) {
      setForm((prev) => ({
        ...prev,
        role: roleOptionsForCreate[0] || "User",
      }));
    }
  }, [roleOptionsForCreate, form.role]);

  async function loadUsers() {
    try {
      setLoading(true);
      setErr("");

      const res = await api.get("/users");
      const data = Array.isArray(res.data) ? res.data : [];

      setUsers(data);

      const nextDrafts = {};
      data.forEach((u) => {
        nextDrafts[u.id] = u.role || "User";
      });
      setDraftRoles(nextDrafts);
    } catch (e) {
      console.error("LOAD USERS ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function createUser(e) {
    e.preventDefault();

    try {
      setErr("");
      setMsg("");

      if (!form.name || !form.email) {
        setErr("Name and email are required");
        return;
      }

      const res = await api.post("/users", {
        name: form.name,
        email: form.email,
        role: currentRole === "Staff" ? "User" : form.role,
        room_no: form.room_no,
        contact: form.contact,
      });

      setMsg(res.data?.message || "User created successfully");

      setForm({
        name: "",
        email: "",
        role: roleOptionsForCreate[0] || "User",
        room_no: "",
        contact: "",
      });

      await loadUsers();
    } catch (e) {
      console.error("CREATE USER ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to create user");
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
      const updatedUser = res.data?.user;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: updatedUser?.role || newRole } : u
        )
      );

      setDraftRoles((prev) => ({
        ...prev,
        [userId]: updatedUser?.role || newRole,
      }));

      setMsg(res.data?.message || "Role updated successfully");
    } catch (e) {
      console.error("CHANGE ROLE ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to update role");
    }
  }

  async function deleteUser(userId) {
    try {
      setErr("");
      setMsg("");

      await api.delete(`/users/${userId}`);

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMsg("User deleted successfully");
    } catch (e) {
      console.error("DELETE USER ERROR:", e);
      setErr(e?.response?.data?.error || "Failed to delete user");
    }
  }

  const normalUsers = users.filter((u) => u.role === "User");
  const staffUsers = users.filter((u) => u.role === "Staff");
  const adminUsers = users.filter((u) => u.role === "Admin");

  function renderTableRows(list) {
    return list.map((u) => (
      <tr key={u.id}>
        <td>{u.name}</td>
        <td>{u.email}</td>
        <td>{u.role}</td>
        <td>{u.room_no || "-"}</td>
        <td>{u.contact || "-"}</td>
        <td>{u.must_change_password ? "Pending Change" : "Changed"}</td>

        {canChangeRole && (
          <td>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                className="input"
                style={{ margin: 0 }}
                value={draftRoles[u.id] || u.role}
                onChange={(e) =>
                  setDraftRoles((prev) => ({
                    ...prev,
                    [u.id]: e.target.value,
                  }))
                }
              >
                <option value="User">User</option>
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>

              <button
                className="btn btnBlue"
                type="button"
                onClick={() => changeRole(u.id)}
              >
                Update
              </button>
            </div>
          </td>
        )}

        {canDeleteUsers && (
          <td>
            <button
              className="btn"
              type="button"
              onClick={() => deleteUser(u.id)}
              disabled={u.role === "Admin"}
            >
              Delete
            </button>
          </td>
        )}
      </tr>
    ));
  }

  function renderTable(title, list) {
    return (
      <div className="card" style={{ marginTop: 18 }}>
        <h3>{title}</h3>

        {list.length === 0 ? (
          <p>No records found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Room</th>
                  <th>Contact</th>
                  <th>Temp Password</th>
                  {canChangeRole && <th>Change Role</th>}
                  {canDeleteUsers && <th>Delete</th>}
                </tr>
              </thead>
              <tbody>{renderTableRows(list)}</tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid">
      {canAddUsers && (
        <div className="card">
          <h2>Manage Users</h2>

          {msg ? <p style={{ color: "green", marginBottom: 12 }}>{msg}</p> : null}
          {err ? <p style={{ color: "red", marginBottom: 12 }}>{err}</p> : null}

          <form onSubmit={createUser}>
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={currentRole === "Staff"}
            >
              {roleOptionsForCreate.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Room No"
              value={form.room_no}
              onChange={(e) => setForm({ ...form, room_no: e.target.value })}
            />

            <input
              className="input"
              placeholder="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />

            <button className="btn btnBlue" type="submit">
              Add User
            </button>
          </form>

          <p className="muted" style={{ marginTop: 12 }}>
            Temporary password will be generated automatically and sent to the user's email.
          </p>
        </div>
      )}

        <div>
        {loading ? (
          <div className="card">
            <h3>Users List</h3>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            {renderTable("Users List", normalUsers)}
            {renderTable("Staff List", staffUsers)}
            {renderTable("Admin List", adminUsers)}
          </>
        )}
      </div>
    </div>
  );
}