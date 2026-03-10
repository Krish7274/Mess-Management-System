import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [form, setForm] = useState({ name:"", contact:"", room_no:"" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/users/me").then(res => setForm(res.data));
  }, []);

  async function save(){
    setMsg("");
    await api.put("/users/me", form);
    setMsg("Saved ✅");
  }

  return (
    <div className="card">
      <h2>Profile</h2>
      {msg && <div className="badge">{msg}</div>}

      <label className="muted">Name</label>
      <input className="input" value={form.name||""} onChange={(e)=>setForm({...form, name:e.target.value})} />

      <label className="muted">Contact</label>
      <input className="input" value={form.contact||""} onChange={(e)=>setForm({...form, contact:e.target.value})} />

      <label className="muted">Room No</label>
      <input className="input" value={form.room_no||""} onChange={(e)=>setForm({...form, room_no:e.target.value})} />

      <button className="btn btnBlue" onClick={save}>Save</button>
    </div>
  );
}