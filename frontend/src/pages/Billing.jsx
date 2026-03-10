import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Billing() {
  const u = getUser();
  const isAdmin = u?.role === "Admin";

  const [my, setMy] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id:"", month:"2026-03", amount:1500 });

  async function loadMy(){
    const res = await api.get("/billing/my");
    setMy(res.data);
  }

  useEffect(()=>{ loadMy(); }, []);

  useEffect(() => {
    if (isAdmin) api.get("/users").then(res => setUsers(res.data));
  }, [isAdmin]);

  async function createBill(){
    await api.post("/billing/create", { ...form, user_id:Number(form.user_id), amount:Number(form.amount) });
    alert("Bill created ✅");
  }

  async function pay(id){
    await api.post("/billing/pay", { bill_id:id, mode:"UPI" });
    loadMy();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>My Bills</h2>
        <ul className="muted">
          {my.map(b => (
            <li key={b.id}>
              {b.month} • ₹{b.amount} • <b>{b.status}</b>{" "}
              {b.status !== "Paid" && <button className="btn btnBlue" onClick={()=>pay(b.id)}>Pay (UPI)</button>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Admin Create Bill</h2>
        {!isAdmin ? (
          <p className="muted">Only Admin can create bills.</p>
        ) : (
          <>
            <select className="input" value={form.user_id} onChange={(e)=>setForm({...form, user_id:e.target.value})}>
              <option value="">Select user</option>
              {users.map(x => <option key={x.id} value={x.id}>{x.name} ({x.email})</option>)}
            </select>
            <input className="input" value={form.month} onChange={(e)=>setForm({...form, month:e.target.value})} />
            <input className="input" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} />
            <button className="btn btnRed" onClick={createBill}>Create</button>
          </>
        )}
      </div>
    </div>
  );
}