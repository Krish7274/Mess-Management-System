import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Attendance() {
  const user = getUser();
  const navigate = useNavigate();
  const isAdminOrStaff = user?.role === "Admin" || user?.role === "Staff";

  const [date, setDate] = useState(todayYYYYMMDD());
  const [mealType, setMealType] = useState("Lunch");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(user?.id ? String(user.id) : "");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [billingInfo, setBillingInfo] = useState(null);

  useEffect(() => {
    if (!isAdminOrStaff) return;

    api
      .get("/users")
      .then((res) => {
        const list = res.data || [];
        setUsers(list);
        if (list.length > 0 && !selectedUserId) {
          setSelectedUserId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [isAdminOrStaff, selectedUserId]);

  async function loadRecords() {
    setErr("");
    try {
      const res = await api.get(
        `/attendance?date=${encodeURIComponent(date)}&meal_type=${encodeURIComponent(mealType)}`
      );
      setRecords(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load attendance");
    }
  }

  useEffect(() => {
    loadRecords();
  }, [date, mealType]);

  async function markAttendance(status) {
    setMsg("");
    setErr("");
    setBillingInfo(null);
    setLoading(true);

    try {
      const payload = {
        date,
        meal_type: mealType,
        status,
      };

      if (isAdminOrStaff) {
        payload.user_id = Number(selectedUserId);
      }

      const res = await api.post("/attendance", payload);
      setMsg(
        [res.data?.message, res.data?.billing_message].filter(Boolean).join(" • ") ||
          "Attendance saved"
      );
      setBillingInfo(res.data?.bill || null);
      await loadRecords();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  }

  const takenList = useMemo(() => records.filter((r) => r.status === "Taken"), [records]);
  const skippedList = useMemo(() => records.filter((r) => r.status === "Skipped"), [records]);

  function getUserName(userId) {
    const found = users.find((u) => u.id === userId);
    return found ? found.name : `User ID: ${userId}`;
  }

  return (
    <div className="grid">
      <div className="card">
        <h1>Meal Attendance</h1>

        {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && (
          <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>
            {err}
          </div>
        )}

        {billingInfo && (
          <div className="card" style={{ marginBottom: 12 }}>
            <h3 style={{ marginBottom: 8 }}>Bill Created for This Attendance</h3>
            <p className="muted" style={{ marginBottom: 8 }}>
              {billingInfo.period} • {billingInfo.bill_type} • ₹{billingInfo.amount} • {billingInfo.status}
            </p>
            <div className="row">
              <button className="btn btnBlue" onClick={() => navigate("/app/billing")}>
                Pay This Bill / View Bills
              </button>
            </div>
          </div>
        )}

        <label className="muted">Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="muted">Meal Type</label>
        <select className="input" value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
        </select>

        {isAdminOrStaff ? (
          <>
            <label className="muted">Select Student</label>
            <select
              className="input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
            <p className="muted">
              Admin/Staff can mark attendance for any student. When attendance is marked as Taken,
              a daily bill is created automatically.
            </p>
          </>
        ) : (
          <p className="muted">
            You can mark only your own attendance. After marking Taken, you can pay that meal bill now
            or generate one monthly bill later from the Billing page.
          </p>
        )}

        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btnBlue" disabled={loading} onClick={() => markAttendance("Taken")}>
            ✅ Mark Taken
          </button>

          <button className="btn btnRed" disabled={loading} onClick={() => markAttendance("Skipped")}>
            ❌ Mark Skipped
          </button>
        </div>
      </div>

      <div className="card">
        <h2>
          Lists for {date} — {mealType}
        </h2>

        <div className="grid">
          <div className="card">
            <h3>✅ Taken</h3>
            {takenList.length === 0 ? (
              <p className="muted">No records</p>
            ) : (
              <ul className="muted">
                {takenList.map((r) => (
                  <li key={r.id}>{isAdminOrStaff ? getUserName(r.user_id) : `User ID: ${r.user_id}`}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3>❌ Skipped</h3>
            {skippedList.length === 0 ? (
              <p className="muted">No records</p>
            ) : (
              <ul className="muted">
                {skippedList.map((r) => (
                  <li key={r.id}>{isAdminOrStaff ? getUserName(r.user_id) : `User ID: ${r.user_id}`}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h3>All Records</h3>
          {records.length === 0 ? (
            <p className="muted">No records found</p>
          ) : (
            <ul className="muted">
              {records.map((r) => (
                <li key={r.id}>
                  {isAdminOrStaff ? getUserName(r.user_id) : `User ID: ${r.user_id}`} • {r.meal_type} • {r.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}