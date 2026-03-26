import { getUser } from "../auth";
import api from "../api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const u = getUser();

  const [users, setUsers] = useState([]);
  const [todayMenu, setTodayMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    if (u?.role === "Admin") {
      api
        .get("/users")
        .then((res) => setUsers(res.data || []))
        .catch(() => {});
    } else {
      fetchTodaysMenuFromWeekly();
    }
  }, []);

  async function fetchTodaysMenuFromWeekly() {
    try {
      setMenuLoading(true);
      setMenuError("");

      const today = new Date().toISOString().split("T")[0];

      const res = await api.get(`/menu/weekly/today?date=${today}`);

      setTodayMenu(res.data || null);
    } catch (err) {
      console.error("Failed to load today's weekly menu:", err);
      setTodayMenu(null);

      const apiMessage =
        err?.response?.data?.error ||
        "Could not load today's menu from weekly menu.";

      setMenuError(apiMessage);
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

              {menuLoading && <p className="muted">Loading today's menu...</p>}

              {!menuLoading && menuError && (
                <p className="muted">{menuError}</p>
              )}

              {!menuLoading && !menuError && !todayMenu && (
                <p className="muted">No menu added for today.</p>
              )}

              {!menuLoading && !menuError && todayMenu && (
                <div className="muted">
                  <p>
                    <strong>Date:</strong> {todayMenu.date}
                  </p>
                  <p>
                    <strong>Day:</strong> {todayMenu.day}
                  </p>
                  <p>
                    <strong>Breakfast:</strong>{" "}
                    {todayMenu.breakfast?.items || "Not added"}
                    {todayMenu.breakfast?.price > 0
                      ? ` (₹${todayMenu.breakfast.price})`
                      : ""}
                  </p>
                  <p>
                    <strong>Lunch:</strong>{" "}
                    {todayMenu.lunch?.items || "Not added"}
                    {todayMenu.lunch?.price > 0
                      ? ` (₹${todayMenu.lunch.price})`
                      : ""}
                  </p>
                  <p>
                    <strong>Dinner:</strong>{" "}
                    {todayMenu.dinner?.items || "Not added"}
                    {todayMenu.dinner?.price > 0
                      ? ` (₹${todayMenu.dinner.price})`
                      : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}