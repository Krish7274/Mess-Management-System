import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Menu from "./pages/Menu";
import Attendance from "./pages/Attendance";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Complaints from "./pages/Complaints";
import Notifications from "./pages/Notifications";
import AdminUsers from "./pages/AdminUsers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="menu" element={<Menu />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="billing" element={<Billing />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="admin-users" element={<AdminUsers />} />
        </Route>

        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <div className="container">
              <div className="card">404 - Page Not Found</div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}