import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("google_token");

  if (!token) return <Navigate to="/signin" replace />;

  return children;
};

export default ProtectedRoute;
