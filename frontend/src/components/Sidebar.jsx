import { NavLink } from "react-router-dom";
import { getUser, logout } from "../auth";

export default function Sidebar() {
  const u = getUser();
  const isAdminOrStaff = u?.role === "Admin" || u?.role === "Staff";
  const isAdmin = u?.role === "Admin";

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: "12px",
    margin: "6px 0",
    color: "var(--txt)",
    textDecoration: "none",
    background: isActive ? "rgba(59,130,246,.18)" : "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.08)",
    fontWeight: 700
  });

  return (
    <div className="sidebar">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 28 }}>🍽️ MESS</div>
            <div className="muted" style={{ fontSize: 14 }}>
              {u?.name} ({u?.role})
            </div>
          </div>

          <button className="btn btnRed" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="nav" style={{ marginTop: 12 }}>
        <NavLink to="/app" end style={linkStyle}>
          Dashboard
        </NavLink>

        <NavLink to="/app/profile" style={linkStyle}>
          Profile
        </NavLink>

        <NavLink to="/app/menu" style={linkStyle}>
          Menu
        </NavLink>

        <NavLink to="/app/attendance" style={linkStyle}>
          Attendance
        </NavLink>

        <NavLink to="/app/complaints" style={linkStyle}>
          Complaints
        </NavLink>

        <NavLink to="/app/notifications" style={linkStyle}>
          Notifications
        </NavLink>

        <NavLink to="/app/billing" style={linkStyle}>
          Billing
        </NavLink>

        {isAdminOrStaff && (
          <NavLink to="/app/inventory" style={linkStyle}>
            Inventory
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/app/admin-users" style={linkStyle}>
            Admin Users
          </NavLink>
        )}
      </div>
    </div>
  );
}