import { NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const userName = user?.name || "User";
  const userRole = user?.role || "Role";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navItems = [
    { to: "/app", label: "Dashboard" },
    { to: "/app/profile", label: "Profile" },
    { to: "/app/menu", label: "Menu" },
    { to: "/app/attendance", label: "Attendance" },
    { to: "/app/complaints", label: "Complaints" },
    { to: "/app/notifications", label: "Notifications" },
    { to: "/app/billing", label: "Billing" },
    { to: "/app/inventory", label: "Inventory" },
    { to: "/app/admin-users", label: "Admin Users" },
  ];

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <div className="brandBlock">
          <div className="brandTitle">🍽️ MESS</div>
          <div className="brandSubtext">
            {userName} ({userRole})
          </div>
        </div>
      </div>

      <nav className="navMenu">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              isActive ? "navItem active" : "navItem"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbarRight">
        <button className="logoutBtn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}