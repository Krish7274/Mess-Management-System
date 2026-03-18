import { Navigate } from "react-router-dom";
import { isLoggedIn, getUser } from "../auth";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const user = getUser();

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}