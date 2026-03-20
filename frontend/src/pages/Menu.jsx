import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Menu() {
  const u = getUser();
  const canAdd = u?.role === "Admin" || u?.role === "Staff";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    date: "",
    meal_type: "Lunch",
    items: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await api.get("/menu");
      setList(res.data || []);
    } catch (error) {
      console.error("LOAD MENU ERROR:", error);
      setErr("Failed to load menu");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    try {
      setErr("");
      setMsg("");

      if (!form.date || !form.meal_type || !form.items.trim()) {
        setErr("Please fill date, meal type and food items");
        return;
      }

      setLoading(true);

      await api.post("/menu", {
        date: form.date,
        meal_type: form.meal_type,
        items: form.items.trim(),
      });

      setMsg("Menu added successfully");
      setForm({
        date: "",
        meal_type: "Lunch",
        items: "",
      });

      await load();
    } catch (error) {
      console.error("ADD MENU ERROR:", error);
      setErr(error?.response?.data?.error || "Failed to add menu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      {canAdd && (
        <div className="card">
          <h2>Menu</h2>

          {msg ? <p style={{ color: "green", marginBottom: "10px" }}>{msg}</p> : null}
          {err ? <p style={{ color: "red", marginBottom: "10px" }}>{err}</p> : null}

          <input
            type="date"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <select
            className="input"
            value={form.meal_type}
            onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>

          <textarea
            className="input"
            rows="4"
            placeholder="Food items..."
            value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
          />

          <button
            className="btn btnBlue"
            onClick={add}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Menu"}
          </button>
        </div>
      )}

      <div className="card">
        <h3>Recent Menu</h3>

        {list.length === 0 ? (
          <p className="muted">No menu added yet.</p>
        ) : (
          <ul className="muted">
            {list.map((m) => (
              <li key={m.id} style={{ marginBottom: "10px" }}>
                <b>{m.date}</b> • {m.meal_type} → {m.items}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}