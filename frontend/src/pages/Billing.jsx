import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { getUser } from "../auth";
import upiQr from "../assets/upi-qr.jpeg";

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

export default function Billing() {
  const u = getUser();
  const isAdmin = u?.role === "Admin";

  const [myBills, setMyBills] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [billingSearch, setBillingSearch] = useState("");
  const [monthlyPeriod, setMonthlyPeriod] = useState(currentMonthValue());
  const [monthlyUserId, setMonthlyUserId] = useState("");

  const [form, setForm] = useState({
    user_id: "",
    bill_type: "monthly",
    period: currentMonthValue(),
    amount: 1500,
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [allBillsErr, setAllBillsErr] = useState("");

  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [selectedBillAmount, setSelectedBillAmount] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentNote, setPaymentNote] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");

  async function loadMyBills() {
    try {
      const res = await api.get("/billing/my");
      setMyBills(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to load bills");
    }
  }

  async function loadAllBills() {
    if (!isAdmin) return;

    try {
      setAllBillsErr("");
      const res = await api.get("/billing/all");
      setAllBills(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setAllBills([]);
      setAllBillsErr(e?.response?.data?.error || "Failed to load all users billing list");
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;

    try {
      const res = await api.get("/users");
      const list = res.data || [];
      setUsers(list);
      if (!monthlyUserId && list.length > 0) {
        setMonthlyUserId(String(list[0].id));
      }
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadMyBills();
    loadUsers();
    loadAllBills();
  }, []);

  async function createBill() {
    setMsg("");
    setErr("");

    if (!form.user_id || !form.period || !form.amount) {
      setErr("Select user, bill type, period and amount");
      return;
    }

    try {
      const res = await api.post("/billing/create", {
        user_id: Number(form.user_id),
        bill_type: form.bill_type,
        period: form.period,
        amount: Number(form.amount),
      });

      setMsg(res.data?.message || "Bill created successfully");
      setForm({
        user_id: "",
        bill_type: "monthly",
        period: currentMonthValue(),
        amount: 1500,
      });

      loadMyBills();
      loadAllBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create bill");
    }
  }

  async function generateMonthlyAttendanceBill() {
    setMsg("");
    setErr("");

    try {
      const payload = { period: monthlyPeriod };
      if (isAdmin && monthlyUserId) {
        payload.user_id = Number(monthlyUserId);
      }

      const res = await api.post("/billing/generate-monthly", payload);
      setMsg(res.data?.message || "Monthly attendance bill generated successfully");
      loadMyBills();
      loadAllBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to generate monthly attendance bill");
    }
  }

  function openQrModal(billId, amount) {
    setSelectedBillId(billId);
    setSelectedBillAmount(amount);
    setPaymentProof(null);
    setPaymentNote("");
    setReceiptData(null);
    setPaymentSuccess(false);
    setPaymentSuccessMessage("");
    setShowQrModal(true);
  }

  function closeQrModal() {
    setShowQrModal(false);
    setSelectedBillId(null);
    setSelectedBillAmount("");
    setPaymentProof(null);
    setPaymentNote("");
    setReceiptData(null);
    setPaymentSuccess(false);
    setPaymentSuccessMessage("");
  }

  async function markBillPaid() {
    try {
      setErr("");

      if (!selectedBillId) {
        setErr("No bill selected");
        return;
      }

      const formData = new FormData();
      formData.append("bill_id", selectedBillId);
      formData.append("mode", "UPI");
      formData.append("note", paymentNote || "");

      if (paymentProof) {
        formData.append("proof", paymentProof);
      }

      await api.post("/billing/pay", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const receiptRes = await api.get(`/billing/receipt/${selectedBillId}`);
      setReceiptData(receiptRes.data || null);
      setPaymentSuccess(true);
      setPaymentSuccessMessage("Payment recorded successfully");

      loadMyBills();
      loadAllBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to update payment");
    }
  }

  function downloadReceipt(receipt) {
    if (!receipt) return;

    const content = `
MESS MANAGEMENT SYSTEM PAYMENT RECEIPT
-------------------------------------
Receipt No : ${receipt.receipt_no}
Bill ID    : ${receipt.bill_id}
Bill Type  : ${receipt.bill_type}
Meal Type  : ${receipt.meal_type || "-"}
Period     : ${receipt.period}
Amount     : ₹${receipt.amount}
Mode       : ${receipt.mode}
Paid At    : ${receipt.paid_at}
Meals Inc. : ${receipt.included_meals_count || 0}
Proof URL  : ${receipt.proof_url || "No proof uploaded"}

Thank you for your payment.
    `.trim();

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${receipt.receipt_no}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  const filteredAllBills = useMemo(() => {
    const q = billingSearch.trim().toLowerCase();
    if (!q) return allBills;

    return allBills.filter((bill) => {
      const text = [
        bill.user_name,
        bill.user_email,
        bill.bill_type,
        bill.meal_type,
        bill.period,
        bill.amount,
        bill.status,
        bill.payment?.mode,
        bill.payment?.receipt_no,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [allBills, billingSearch]);

  return (
    <div className="grid">
      <div className="card">
        <h1>My Bills</h1>

        {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>{err}</div>}

        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Generate Monthly Bill From Attendance</h3>
          <p className="muted" style={{ marginBottom: 8 }}>
            Mark daily attendance as Taken. You can either pay each meal bill separately or generate one monthly bill from all unpaid meal attendance for a month.
          </p>

          {isAdmin && (
            <select
              className="input"
              value={monthlyUserId}
              onChange={(e) => setMonthlyUserId(e.target.value)}
            >
              {users.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.email})
                </option>
              ))}
            </select>
          )}

          <input
            className="input"
            type="month"
            value={monthlyPeriod}
            onChange={(e) => setMonthlyPeriod(e.target.value)}
          />

          <button className="btn btnBlue" onClick={generateMonthlyAttendanceBill}>
            Generate Monthly Attendance Bill
          </button>
        </div>

        {myBills.length === 0 ? (
          <p className="muted">No bills found</p>
        ) : (
          <ul className="muted">
            {myBills.map((b) => (
              <li key={b.id} style={{ marginBottom: 14 }}>
                <div>
                  <b>{b.period}</b> • {b.bill_type === "daily" ? "Daily" : "Monthly"}
                  {b.meal_type ? ` • ${b.meal_type}` : ""} • ₹{b.amount} • <b>{b.status}</b>
                  {b.included_meals_count ? ` • ${b.included_meals_count} meals` : ""}
                </div>

                <div className="row" style={{ marginTop: 8 }}>
                  {b.can_pay && (
                    <button className="btn btnBlue" onClick={() => openQrModal(b.id, b.amount)}>
                      Pay (UPI)
                    </button>
                  )}

                  {b.status === "Paid" && b.payment?.receipt_no && (
                    <button
                      className="btn btnRed"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/billing/receipt/${b.id}`);
                          downloadReceipt(res.data);
                        } catch {
                          setErr("Could not download receipt");
                        }
                      }}
                    >
                      Receipt
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isAdmin && (
        <div className="card">
          <h1>Admin Create Manual Bill</h1>
          <p className="muted" style={{ marginBottom: 12 }}>
            Admin can still create manual daily or monthly bills from here.
          </p>

          <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Select user</option>
            {users.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({x.email})
              </option>
            ))}
          </select>

          <select
            className="input"
            value={form.bill_type}
            onChange={(e) =>
              setForm({
                ...form,
                bill_type: e.target.value,
                period: e.target.value === "daily" ? new Date().toISOString().slice(0, 10) : currentMonthValue(),
              })
            }
          >
            <option value="monthly">Monthly Bill</option>
            <option value="daily">Daily Bill</option>
          </select>

          <input
            className="input"
            type={form.bill_type === "daily" ? "date" : "month"}
            value={form.period}
            onChange={(e) => setForm({ ...form, period: e.target.value })}
          />

          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount"
          />

          <button className="btn btnRed" onClick={createBill}>Create</button>
        </div>
      )}

      {isAdmin && (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="searchBarWrap" style={{ marginBottom: 14 }}>
            <div>
              <h1 style={{ marginBottom: 6 }}>All Users Billing List</h1>
              <p className="muted" style={{ marginBottom: 0 }}>
                Search by user name, email, bill type, period, meal type, amount, or status.
              </p>
            </div>

            <input
              className="input searchInput"
              placeholder="Search billing user..."
              value={billingSearch}
              onChange={(e) => setBillingSearch(e.target.value)}
            />
          </div>

          {allBillsErr && <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>{allBillsErr}</div>}

          {filteredAllBills.length === 0 ? (
            <p className="muted">No billing records found</p>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Meal</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Meals</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllBills.map((b) => (
                    <tr key={b.id}>
                      <td>{b.user_name}<br /><span className="muted">{b.user_email}</span></td>
                      <td>{b.period}</td>
                      <td>{b.bill_type}</td>
                      <td>{b.meal_type || "-"}</td>
                      <td>₹{b.amount}</td>
                      <td>{b.status}</td>
                      <td>{b.included_meals_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showQrModal && (
        <div className="modalOverlay" onClick={closeQrModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: 10 }}>UPI Payment</h2>
            <p className="muted" style={{ marginBottom: 10 }}>Amount to pay: ₹{selectedBillAmount}</p>
            <img src={upiQr} alt="UPI QR" style={{ width: 220, maxWidth: "100%", borderRadius: 12, marginBottom: 14 }} />

            <textarea
              className="input"
              rows="3"
              placeholder="Add note (optional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />

            <input className="input" type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files?.[0] || null)} />

            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn btnBlue" onClick={markBillPaid}>I Have Paid</button>
              <button className="btn btnRed" onClick={closeQrModal}>Close</button>
            </div>

            {paymentSuccess && <div className="badge" style={{ marginTop: 12 }}>{paymentSuccessMessage}</div>}

            {receiptData && (
              <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ marginBottom: 8 }}>Receipt Ready</h3>
                <p className="muted" style={{ marginBottom: 8 }}>
                  Receipt No: {receiptData.receipt_no}<br />
                  Bill Type: {receiptData.bill_type}<br />
                  Period: {receiptData.period}<br />
                  Amount: ₹{receiptData.amount}
                </p>
                <button className="btn btnBlue" onClick={() => downloadReceipt(receiptData)}>
                  Download Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}