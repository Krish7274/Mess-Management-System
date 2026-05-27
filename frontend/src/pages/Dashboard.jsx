import { getUser } from "../auth";
import api from "../api";
import { useEffect, useMemo, useState } from "react";

function toYYYYMMDD(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function tomorrowYYYYMMDD() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toYYYYMMDD(d);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function DonutChart({ taken, skipped, centerLabel = "Taking" }) {
  const total = Math.max(Number(taken || 0) + Number(skipped || 0), 1);
  const percent = Math.round((Number(taken || 0) / total) * 100);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashTaken = (Number(taken || 0) / total) * circumference;
  const dashSkipped = circumference - dashTaken;

  return (
    <div className="dashboardDonutWrap">
      <svg className="dashboardDonut" viewBox="0 0 120 120">
        <circle className="donutTrack" cx="60" cy="60" r={radius} />
        <circle
          className="donutTaken"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={`${dashTaken} ${circumference}`}
        />
        <circle
          className="donutSkipped"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={`${dashSkipped} ${circumference}`}
          strokeDashoffset={-dashTaken}
        />
      </svg>

      <div className="dashboardDonutCenter">
        <strong>{percent}%</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}

function PillarChart({ paid, unpaid }) {
  const max = Math.max(Number(paid || 0), Number(unpaid || 0), 1);
  const paidHeight = Math.max((Number(paid || 0) / max) * 100, paid > 0 ? 12 : 4);
  const unpaidHeight = Math.max((Number(unpaid || 0) / max) * 100, unpaid > 0 ? 12 : 4);

  return (
    <div className="dashboardPillarChart">
      <div className="pillarItem">
        <div className="pillarValue">{paid}</div>
        <div className="pillarBarShell">
          <div className="pillarBar pillarPaid" style={{ height: `${paidHeight}%` }} />
        </div>
        <span>Paid</span>
      </div>

      <div className="pillarItem">
        <div className="pillarValue">{unpaid}</div>
        <div className="pillarBarShell">
          <div className="pillarBar pillarUnpaid" style={{ height: `${unpaidHeight}%` }} />
        </div>
        <span>Unpaid</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const u = getUser();
  const isAdminOrStaff = u?.role === "Admin" || u?.role === "Staff";

  const [users, setUsers] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [bills, setBills] = useState([]);
  const [myBills, setMyBills] = useState([]);
  const [todayMenu, setTodayMenu] = useState(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [dashboardError, setDashboardError] = useState("");

  const nextDay = tomorrowYYYYMMDD();

  useEffect(() => {
    if (isAdminOrStaff) {
      loadAdminDashboard();
    } else {
      loadStudentDashboard();
    }
  }, [isAdminOrStaff]);

  async function loadAdminDashboard() {
    try {
      setDashboardError("");

      const [usersRes, plansRes, billsRes] = await Promise.all([
        api.get("/users"),
        api.get(`/meal-plans?date=${encodeURIComponent(nextDay)}`),
        api.get("/billing/all"),
      ]);

      setUsers((usersRes.data || []).filter((x) => x.role === "User"));
      setMealPlans(plansRes.data || []);
      setBills(billsRes.data || []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setDashboardError(err?.response?.data?.error || "Failed to load dashboard graph data.");
    }
  }

  async function loadStudentDashboard() {
    try {
      setMenuLoading(true);
      setMenuError("");

      const today = new Date().toISOString().split("T")[0];

      const [menuRes, billsRes] = await Promise.all([
        api.get(`/menu/weekly/today?date=${today}`),
        api.get("/billing/my"),
      ]);

      setTodayMenu(menuRes.data || null);
      setMyBills(billsRes.data || []);
    } catch (err) {
      console.error("Student dashboard load failed:", err);
      setTodayMenu(null);
      setMyBills([]);
      setMenuError(err?.response?.data?.error || "Could not load dashboard data.");
    } finally {
      setMenuLoading(false);
    }
  }

  const dashboardStats = useMemo(() => {
    const totalStudents = users.length;

    const takingIds = new Set(
      mealPlans
        .filter((p) => p.breakfast || p.lunch || p.dinner)
        .map((p) => Number(p.user_id))
    );

    const takingMeal = takingIds.size;
    const skippedMeal = Math.max(totalStudents - takingMeal, 0);

    const paidIds = new Set(
      bills
        .filter((b) => b.status === "Paid")
        .map((b) => Number(b.user_id))
        .filter(Boolean)
    );

    const unpaidIds = new Set(
      bills
        .filter((b) => b.status === "Unpaid" || b.status === "Pending")
        .map((b) => Number(b.user_id))
        .filter(Boolean)
    );

    return {
      totalStudents,
      takingMeal,
      skippedMeal,
      paidStudents: paidIds.size,
      unpaidStudents: unpaidIds.size,
      totalBills: bills.length,
    };
  }, [users, mealPlans, bills]);

  const myBillStats = useMemo(() => {
    const paidBills = myBills.filter((b) => b.status === "Paid");
    const unpaidBills = myBills.filter((b) => b.status === "Unpaid" || b.status === "Pending");

    const paidAmount = paidBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const unpaidAmount = unpaidBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      paid: paidBills.length,
      unpaid: unpaidBills.length,
      total: myBills.length,
      paidAmount,
      unpaidAmount,
    };
  }, [myBills]);

  return (
    <div className="dashboardPage">
      <div className="card dashboardHeroCard">
        <div className="header dashboardHeroHeader">
          <div>
            <h2>Dashboard</h2>
            <div className="muted">
              Welcome {u?.name} ({u?.role})
            </div>
          </div>

          <div className="dashboardHeaderActions">
            <span className="badge">JWT Secure</span>

            {isAdminOrStaff && (
              <button className="btn btnGreen dashboardRefreshBtn" onClick={loadAdminDashboard}>
                Refresh Graphs
              </button>
            )}
          </div>
        </div>
      </div>

      {isAdminOrStaff ? (
        <>
          {dashboardError && <div className="status-box status-error">{dashboardError}</div>}

          <div className="dashboardStatsGrid">
            <div className="dashboardStatCard">
              <span>Total Students</span>
              <strong>{dashboardStats.totalStudents}</strong>
            </div>

            <div className="dashboardStatCard statGreen">
              <span>Taking Meal Tomorrow</span>
              <strong>{dashboardStats.takingMeal}</strong>
            </div>

            <div className="dashboardStatCard statRed">
              <span>Skipping Tomorrow</span>
              <strong>{dashboardStats.skippedMeal}</strong>
            </div>

            <div className="dashboardStatCard statBlue">
              <span>Total Bills</span>
              <strong>{dashboardStats.totalBills}</strong>
            </div>
          </div>

          <div className="dashboardChartsGrid">
            <div className="card dashboardChartCard">
              <div className="dashboardChartHead">
                <div>
                  <h3>Next Day Meal Plan</h3>
                  <p className="muted">
                    Students taking meal or skipping on {formatDate(nextDay)}
                  </p>
                </div>
                <span className="badge">Meal</span>
              </div>

              <DonutChart
                taken={dashboardStats.takingMeal}
                skipped={dashboardStats.skippedMeal}
              />

              <div className="dashboardLegend">
                <div>
                  <span className="legendDot legendGreen"></span>
                  Taking: {dashboardStats.takingMeal}
                </div>
                <div>
                  <span className="legendDot legendRed"></span>
                  Skipping: {dashboardStats.skippedMeal}
                </div>
              </div>
            </div>

            <div className="card dashboardChartCard">
              <div className="dashboardChartHead">
                <div>
                  <h3>Bill Payment Status</h3>
                  <p className="muted">Student-wise paid and unpaid bill overview</p>
                </div>
                <span className="badge">Billing</span>
              </div>

              <PillarChart
                paid={dashboardStats.paidStudents}
                unpaid={dashboardStats.unpaidStudents}
              />

              <div className="dashboardLegend">
                <div>
                  <span className="legendDot legendBlue"></span>
                  Paid Students: {dashboardStats.paidStudents}
                </div>
                <div>
                  <span className="legendDot legendOrange"></span>
                  Unpaid Students: {dashboardStats.unpaidStudents}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="studentDashboardGrid">
          <div className="card dashboardStudentCard">
            <h3>Today's Menu</h3>

            {menuLoading && <p className="muted">Loading today's menu...</p>}

            {!menuLoading && menuError && <p className="muted">{menuError}</p>}

            {!menuLoading && !menuError && !todayMenu && (
              <p className="muted">No menu added for today.</p>
            )}

            {!menuLoading && !menuError && todayMenu && (
              <div className="muted dashboardMenuDetails">
                <p>
                  <strong>Date:</strong> {todayMenu.date}
                </p>
                <p>
                  <strong>Day:</strong> {todayMenu.day}
                </p>
                <p>
                  <strong>Breakfast:</strong> {todayMenu.breakfast?.items || "Not added"}
                  {todayMenu.breakfast?.price > 0 ? ` (₹${todayMenu.breakfast.price})` : ""}
                </p>
                <p>
                  <strong>Lunch:</strong> {todayMenu.lunch?.items || "Not added"}
                  {todayMenu.lunch?.price > 0 ? ` (₹${todayMenu.lunch.price})` : ""}
                </p>
                <p>
                  <strong>Dinner:</strong> {todayMenu.dinner?.items || "Not added"}
                  {todayMenu.dinner?.price > 0 ? ` (₹${todayMenu.dinner.price})` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="card dashboardChartCard studentBillChartCard">
            <div className="dashboardChartHead">
              <div>
                <h3>My Bill Status</h3>
                <p className="muted">Your own paid and unpaid bill overview</p>
              </div>
              <span className="badge">My Bills</span>
            </div>

            <DonutChart
              taken={myBillStats.paid}
              skipped={myBillStats.unpaid}
              centerLabel="Paid"
            />

            <div className="dashboardLegend">
              <div>
                <span className="legendDot legendGreen"></span>
                Paid: {myBillStats.paid} Bills
              </div>
              <div>
                <span className="legendDot legendRed"></span>
                Unpaid: {myBillStats.unpaid} Bills
              </div>
            </div>

            <div className="studentBillAmountGrid">
              <div>
                <span>Total Bills</span>
                <strong>{myBillStats.total}</strong>
              </div>
              <div>
                <span>Paid Amount</span>
                <strong>₹{myBillStats.paidAmount.toFixed(2)}</strong>
              </div>
              <div>
                <span>Unpaid Amount</span>
                <strong>₹{myBillStats.unpaidAmount.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}