import React from 'react';
import { useNavigate } from "react-router-dom";
import { LogOut as LogOutIcon } from "lucide-react";

const LogOut = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/signin");
  };

  return (
    <button 
      onClick={handleLogout} 
      className="flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group border border-transparent hover:border-red-100"
    >
      <LogOutIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" />
      Sign Out
    </button>
  );
}

export default LogOut;
