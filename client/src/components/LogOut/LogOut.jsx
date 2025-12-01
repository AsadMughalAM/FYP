import React from 'react'
import { useNavigate } from "react-router-dom";
const LogOut = () => {
      const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("google_token");
    navigate("/signin");
  };

  return (
    <button 
      onClick={handleLogout} 
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150 border border-gray-200/60 hover:border-gray-300"
    >
      Logout
    </button>
  )
}

export default LogOut