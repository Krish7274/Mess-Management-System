import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="container">
        <Outlet />
      </div>
    </div>
  );
}