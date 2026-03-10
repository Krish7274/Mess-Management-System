import { useEffect, useState } from "react";
import api from "../api";
import { getUser } from "../auth";

export default function Complaints() {
  const u = getUser();
  const canResolve = u?.role === "Admin" || u?.role === "Staff";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({ type:"Food quality", message:"" });

  async function load(){
    const res = await api.get("/complaints");
    setList(res.data);
  }
  useEffect(()=>{ load(); }, []);

  async function submit(){
    await api.post("/complaints", form);
    setForm({ type:"Food quality", message:"" });
    load();
  }

  async function resolve(id){
    await api.put(`/complaints/${id}/status`, { status:"Resolved" });
    load();
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Submit Complaint</h2>
        <select className="input" value={form.type} onChange={(e)=>setForm({...form, type:e.target.value})}>
          <option>Food quality</option>
          <option>Hygiene</option>
          <option>Staff behavior</option>
          <option>Quantity issues</option>
        </select>
        <textarea className="input" rows="4" value={form.message} onChange={(e)=>setForm({...form, message:e.target.value})} placeholder="Write problem..." />
        <button className="btn btnBlue" onClick={submit}>Submit</button>
      </div>

      <div className="card">
        <h2>Complaints</h2>
        <ul className="muted">
          {list.map(c => (
            <li key={c.id}>
              <b>{c.type}</b> • {c.status} <br/>
              {c.message}
              {canResolve && c.status !== "Resolved" && (
                <div style={{marginTop:8}}>
                  <button className="btn btnRed" onClick={()=>resolve(c.id)}>Mark Resolved</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}