import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Inventory() {
  const u = getUser();
  const canAdd = u?.role === "Admin" || u?.role === "Staff";

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ category:"Groceries", name:"", qty:0, low_limit:5 });

  async function load(){
    const res = await api.get("/inventory");
    setItems(res.data);
  }
  useEffect(()=>{ load(); }, []);

  async function add(){
    await api.post("/inventory", { ...form, qty:Number(form.qty), low_limit:Number(form.low_limit) });
    setForm({ category:"Groceries", name:"", qty:0, low_limit:5 });
    load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Inventory</h2>
        {!canAdd ? <p className="muted">Only Admin/Staff can add inventory.</p> : (
          <>
            <select className="input" value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
              <option>Vegetables</option><option>Groceries</option><option>Spices</option><option>Gas cylinders</option>
            </select>
            <input className="input" placeholder="Item name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
            <input className="input" placeholder="Qty" value={form.qty} onChange={(e)=>setForm({...form, qty:e.target.value})} />
            <input className="input" placeholder="Low limit" value={form.low_limit} onChange={(e)=>setForm({...form, low_limit:e.target.value})} />
            <button className="btn btnBlue" onClick={add}>Add</button>
          </>
        )}
      </div>

      <div className="card">
        <h3>Stock</h3>
        <ul className="muted">
          {items.map(i => (
            <li key={i.id}>
              <b>{i.name}</b> ({i.category}) • qty: {i.qty}
              {i.low && <span style={{marginLeft:10}} className="badge">LOW</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}