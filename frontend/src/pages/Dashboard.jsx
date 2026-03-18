import { getUser } from "../auth";
import api from "../api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const u = getUser();

  const [users, setUsers] = useState([]);
  const [todayMenu, setTodayMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    if (u?.role === "Admin") {
      api.get("/users")
        .then((res) => setUsers(res.data))
        .catch(() => {});
    } else {
      fetchTodaysMenu();
    }
  }, []);

  async function fetchTodaysMenu() {
    try {
      setMenuLoading(true);
      setMenuError("");

      const today = new Date().toISOString().split("T")[0];

      const res = await api.get("/menu");

      const allMenus = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];

      const filteredMenus = allMenus.filter((item) => item.date === today);

      setTodayMenu(filteredMenus);
    } catch (err) {
      console.error("Failed to load today's menu:", err);
      setMenuError("Could not load today's menu.");
    } finally {
      setMenuLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="header">
        <div>
          <h2>Dashboard</h2>
          <div className="muted">
            Welcome {u?.name} ({u?.role})
          </div>
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
          {u?.role === "Admin" ? (
            <>
              <h3>Admin Users (only Admin)</h3>
              <ul className="muted">
                {users.map((x) => (
                  <li key={x.id}>
                    {x.name} - {x.email} - {x.role}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3>Today's Menu</h3>

              {menuLoading && (
                <p className="muted">Loading today's menu...</p>
              )}

              {!menuLoading && menuError && (
                <p className="muted">{menuError}</p>
              )}

              {!menuLoading && !menuError && todayMenu.length === 0 && (
                <p className="muted">No menu added for today.</p>
              )}

              {!menuLoading && !menuError && todayMenu.length > 0 && (
                <ul className="muted">
                  {todayMenu.map((item, index) => (
                    <li key={item.id || index}>
                      <strong>{item.meal_type || item.meal || "Meal"}</strong>
                      {" → "}
                      {item.items || item.menu_items || item.menu || item.name || "Menu Item"}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}