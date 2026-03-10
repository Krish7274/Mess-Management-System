import { getUser } from "../auth";
import api from "../api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const u = getUser();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (u?.role === "Admin") {
      api.get("/users").then(res => setUsers(res.data)).catch(()=>{});
    }
  }, []);

  return (
    <div className="card">
      <div className="header">
        <div>
          <h2>Dashboard</h2>
          <div className="muted">Welcome {u?.name} ({u?.role})</div>
        </div>
        <span className="badge">JWT Secure</span>
      </div>

      <div className="grid">
        <div className="card">
          <h3>Modules</h3>
          <ul className="muted">
            <li>Users & Roles</li>
            <li>Menu</li>
            <li>Attendance</li>
            <li>Billing</li>
            <li>Inventory</li>
            <li>Complaints</li>
            <li>Notifications</li>
          </ul>
        </div>

        <div className="card">
          <h3>Admin Users (only Admin)</h3>
          {u?.role !== "Admin" ? (
            <p className="muted">You are not Admin.</p>
          ) : (
            <ul className="muted">
              {users.map(x => <li key={x.id}>{x.name} - {x.email} - {x.role}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}