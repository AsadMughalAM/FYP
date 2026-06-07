import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Loader2, Lock, User, BookOpen,
  Image as ImageIcon, Stethoscope, MessageSquare, CheckCircle2,
} from "lucide-react";

const FEATURES = [
  { icon: <ImageIcon size={18} />, title: "Image Diagnosis", desc: "Detect disease from a single photo" },
  { icon: <Stethoscope size={18} />, title: "Symptom Diagnosis", desc: "Match symptoms to likely diseases" },
  { icon: <MessageSquare size={18} />, title: "Vet AI Chat", desc: "24/7 veterinary guidance assistant" },
];

const BrandPanel = () => (
  <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden p-12 flex-col justify-between">
    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full"></div>
    <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 blur-[90px] rounded-full"></div>

    <div className="relative z-10 flex items-center gap-3">
      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
        <BookOpen className="text-white" size={24} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">VetAI <span className="text-blue-400">Diagnostics</span></h1>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Intelligent Health Hub</p>
      </div>
    </div>

    <div className="relative z-10">
      <h2 className="text-3xl font-black text-white leading-tight mb-4">
        AI-powered cattle disease detection in seconds.
      </h2>
      <p className="text-slate-400 text-sm leading-relaxed mb-9 max-w-sm">
        Upload a photo or describe symptoms to get an instant diagnosis with treatment,
        prevention, and a built-in veterinary assistant.
      </p>
      <div className="space-y-5">
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shrink-0">
              {f.icon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{f.title}</h4>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <p className="relative z-10 text-[11px] text-slate-500 font-semibold uppercase tracking-[0.2em]">
      © 2026 VetAI Diagnostics · Neural Pathogen Detection
    </p>
  </div>
);

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState(null);
  const successMessage = location.state?.message;
  const { register, handleSubmit, formState: { errors } } = useForm();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await axios.post(`${API_BASE_URL}/token/`, {
        username: data.username,
        password: data.password
      });
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      navigate("/");
    },
    onError: (error) => {
      if (error.response) setApiError(error.response.data);
      else if (error.request) setApiError({ detail: "No response from server. Try again later." });
      else setApiError({ detail: "An unexpected error occurred." });
    }
  });

  const onSubmit = (data) => {
    setApiError(null);
    mutation.mutate(data);
  };

  const isLoading = mutation.isPending;

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans">
      <BrandPanel />

      {/* Form side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <BookOpen className="text-white" size={22} />
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">VetAI <span className="text-blue-600">Diagnostics</span></h1>
          </div>

          <div className="mb-9">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm">Sign in to access your diagnostics dashboard.</p>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm p-4 rounded-xl mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-6 flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="font-semibold">Error:&nbsp;</span>
              <span className="opacity-90">{typeof apiError === 'object' ? (apiError.detail || JSON.stringify(apiError)) : apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Enter your username"
                  disabled={isLoading}
                  {...register("username", { required: "Username is required" })}
                  className={`w-full pl-11 pr-4 py-3.5 text-sm rounded-xl border bg-white transition-all outline-none ${errors.username
                      ? "border-red-200 focus:ring-2 focus:ring-red-100 focus:border-red-400"
                      : "border-slate-200 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500"
                    } ${isLoading ? "bg-slate-50 cursor-not-allowed opacity-70" : ""}`}
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-[11px] font-medium mt-1.5 ml-1 animate-in fade-in duration-200">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })}
                  className={`w-full pl-11 pr-4 py-3.5 text-sm rounded-xl border bg-white transition-all outline-none ${errors.password
                      ? "border-red-200 focus:ring-2 focus:ring-red-100 focus:border-red-400"
                      : "border-slate-200 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500"
                    } ${isLoading ? "bg-slate-50 cursor-not-allowed opacity-70" : ""}`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] font-medium mt-1.5 ml-1 animate-in fade-in duration-200">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all duration-200 flex items-center justify-center gap-2 ${isLoading ? "opacity-80 cursor-not-allowed transform-none" : "active:scale-[0.98]"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 pt-6 border-t border-slate-100">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
