import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";
import upiQr from "../assets/upi-qr.jpeg";

export default function Billing() {
  const u = getUser();
  const isAdmin = u?.role === "Admin";

  const [myBills, setMyBills] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    user_id: "",
    month: "2026-03",
    amount: 1500
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

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
      const res = await api.get("/billing/all");
      setAllBills(res.data || []);
    } catch (e) {
      console.log("All bills error:", e);
    }
  }

  async function loadUsers() {
    if (!isAdmin) return;
    try {
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (e) {
      console.log("Users load error:", e);
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

    if (!form.user_id || !form.month || !form.amount) {
      setErr("Select user, month and amount");
      return;
    }

    try {
      const res = await api.post("/billing/create", {
        user_id: Number(form.user_id),
        month: form.month,
        amount: Number(form.amount)
      });

      setMsg(res.data?.message || "Bill created successfully");
      setForm({
        user_id: "",
        month: "2026-03",
        amount: 1500
      });

      loadMyBills();
      loadAllBills();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create bill");
    }
  }

  function openQrModal(billId, amount) {
    setSelectedBillId(billId);
    setSelectedBillAmount(amount);
    setPaymentProof(null);
    setPaymentNote("");
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
    setPaymentSuccess(false);
    setPaymentSuccessMessage("");
  }

  async function markBillPaid() {
    setMsg("");
    setErr("");

    if (!selectedBillId) {
      setErr("No bill selected");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("bill_id", selectedBillId);
      formData.append("mode", "UPI");
      formData.append("note", paymentNote);

      if (paymentProof) {
        formData.append("proof", paymentProof);
      }

      const res = await api.post("/billing/pay", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setMsg(res.data?.message || "Payment recorded successfully");
      setReceiptData(res.data?.receipt || null);
      setPaymentSuccess(true);
      setPaymentSuccessMessage("✅ Payment screenshot uploaded and bill marked as paid successfully.");

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
Month      : ${receipt.month}
Amount     : ₹${receipt.amount}
Mode       : ${receipt.mode}
Paid At    : ${receipt.paid_at}
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

  return (
    <div className="grid">
      <div className="card">
        <h1>My Bills</h1>

        {msg && <div className="badge" style={{ marginBottom: 12 }}>{msg}</div>}
        {err && (
          <div className="card" style={{ borderColor: "rgba(239,68,68,.35)", marginBottom: 12 }}>
            {err}
          </div>
        )}

        {myBills.length === 0 ? (
          <p className="muted">No bills found</p>
        ) : (
          <ul className="muted">
            {myBills.map((b) => (
              <li key={b.id} style={{ marginBottom: 14 }}>
                {b.month} • ₹{b.amount} • <b>{b.status}</b>{" "}
                {b.status !== "Paid" && (
                  <button
                    className="btn btnBlue"
                    style={{ marginLeft: 10 }}
                    onClick={() => openQrModal(b.id, b.amount)}
                  >
                    Pay (UPI)
                  </button>
                )}

                {b.status === "Paid" && b.payment?.receipt_no && (
                  <button
                    className="btn btnRed"
                    style={{ marginLeft: 10 }}
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
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h1>Admin Create Bill</h1>

        {!isAdmin ? (
          <p className="muted">Only Admin can create bills.</p>
        ) : (
          <>
            <select
              className="input"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">Select user</option>
              {users.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.email})
                </option>
              ))}
            </select>

            <input
              className="input"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              placeholder="Month (e.g. 2026-03)"
            />

            <input
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Amount"
            />

            <button className="btn btnRed" onClick={createBill}>
              Create
            </button>
          </>
        )}
      </div>

      {isAdmin && (
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h1>All Users Billing List (Admin Only)</h1>

          {allBills.length === 0 ? (
            <p className="muted">No user bills found</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Month</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Mode</th>
                    <th style={thStyle}>Receipt</th>
                    <th style={thStyle}>Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {allBills.map((bill) => (
                    <tr key={bill.id}>
                      <td style={tdStyle}>{bill.user_name}</td>
                      <td style={tdStyle}>{bill.user_email}</td>
                      <td style={tdStyle}>{bill.month}</td>
                      <td style={tdStyle}>₹{bill.amount}</td>
                      <td style={tdStyle}>
                        <b style={{ color: bill.status === "Paid" ? "#22c55e" : "#f87171" }}>
                          {bill.status}
                        </b>
                      </td>
                      <td style={tdStyle}>{bill.payment?.mode || "-"}</td>
                      <td style={tdStyle}>
                        {bill.payment?.receipt_no ? bill.payment.receipt_no : "-"}
                      </td>
                      <td style={tdStyle}>
                        {bill.payment?.proof_url ? (
                          <a
                            href={bill.payment.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btnBlue"
                            style={{ textDecoration: "none", display: "inline-block" }}
                          >
                            View Proof
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showQrModal && (
        <div className="qrModalOverlay">
          <div className="qrModalCard qrModalCardSmall">
            {!paymentSuccess ? (
              <>
                <h2 className="qrTitle">Scan QR to Pay</h2>
                <p className="muted qrAmountText">
                  Bill Amount: <b>₹{selectedBillAmount}</b>
                </p>

                <img src={upiQr} alt="UPI QR Code" className="qrImage qrImageSmall" />

                <div className="qrInfoText">
                  <p className="muted"><b>Name:</b> Krish Patel</p>
                  <p className="muted"><b>UPI ID:</b> ptlkrish27@oksbi</p>
                </div>

                <div className="qrFormSection">
                  <label className="muted">Upload payment screenshot proof (optional)</label>
                  <input
                    className="input"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  />

                  <label className="muted">Note (optional)</label>
                  <input
                    className="input"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Transaction note / remarks"
                  />
                </div>

                <div className="row qrButtonRow">
                  <button className="btn btnBlue" onClick={markBillPaid}>
                    I Have Paid
                  </button>
                  <button className="btn btnRed" onClick={closeQrModal}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="qrTitle">Payment Successful</h2>
                <div className="card" style={{ borderColor: "rgba(34,197,94,.35)", marginBottom: 14 }}>
                  {paymentSuccessMessage}
                </div>

                {receiptData && (
                  <div className="qrInfoText">
                    <p className="muted"><b>Receipt No:</b> {receiptData.receipt_no}</p>
                    <p className="muted"><b>Amount:</b> ₹{receiptData.amount}</p>
                    <p className="muted"><b>Paid At:</b> {receiptData.paid_at}</p>
                  </div>
                )}

                <div className="row qrButtonRow">
                  {receiptData && (
                    <button className="btn btnBlue" onClick={() => downloadReceipt(receiptData)}>
                      Download Receipt
                    </button>
                  )}

                  <button className="btn btnRed" onClick={closeQrModal}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,.15)"
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,.08)"
};