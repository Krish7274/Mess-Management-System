import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Menu() {
  const u = getUser();
  const canAdd = u?.role === "Admin" || u?.role === "Staff";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({ date:"", meal_type:"Lunch", items:"" });

  async function load(){
    const res = await api.get("/menu");
    setList(res.data);
  }
  useEffect(()=>{ load(); }, []);

  async function add(){
    await api.post("/menu", form);
    setForm({ date:"", meal_type:"Lunch", items:"" });
    load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Menu</h2>
        {!canAdd ? (
          <p className="muted">Only Admin/Staff can add menu.</p>
        ) : (
          <>
            <input className="input" placeholder="YYYY-MM-DD" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} />
            <select className="input" value={form.meal_type} onChange={(e)=>setForm({...form, meal_type:e.target.value})}>
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
            </select>
            <textarea className="input" rows="4" placeholder="Food items..." value={form.items} onChange={(e)=>setForm({...form, items:e.target.value})} />
            <button className="btn btnBlue" onClick={add}>Add Menu</button>
          </>
        )}
      </div>

      <div className="card">
        <h3>Recent Menu</h3>
        <ul className="muted">
          {list.map(m => (
            <li key={m.id}>
              <b>{m.date}</b> • {m.meal_type} → {m.items}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}