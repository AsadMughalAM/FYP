import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Loader2, Mail, Lock, User } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
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

  const handleGoogleLogin = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google user:", decoded);
      localStorage.setItem("google_token", credentialResponse.credential);
      navigate("/");
    } catch (error) {
      alert(`Google login failed: ${error.message}`);
    }
  };

  const isLoading = mutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-md overflow-hidden transition-all duration-300">
        <div className="p-8 md:p-10">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-500 text-sm">Please enter your details to sign in.</p>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl mb-8 flex items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="font-medium">Error: </span>
              <span className="ml-1 opacity-90">{typeof apiError === 'object' ? (apiError.detail || JSON.stringify(apiError)) : apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-8">
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
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border bg-white transition-all outline-none ring-offset-2 ${
                    errors.username 
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
                  className={`w-full pl-11 pr-4 py-3 text-sm rounded-xl border bg-white transition-all outline-none ring-offset-2 ${
                    errors.password 
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
              className={`w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)] transition-all duration-200 flex items-center justify-center gap-2 ${
                isLoading ? "opacity-80 cursor-not-allowed transform-none" : "active:scale-[0.98]"
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

          <div className="relative flex items-center justify-center mb-8">
            <div className="border-t border-slate-100 w-full"></div>
            <span className="absolute px-4 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-widest">or continue with</span>
          </div>

          <div className="space-y-6">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleLogin} onError={() => alert("Google login failed")} theme="outline" shape="pill" />
              </div>
            ) : (
              <div className="text-center py-2 px-4 rounded-lg bg-slate-50 border border-slate-100">
                 <p className="text-xs text-slate-400 italic">Google login not configured</p>
              </div>
            )}

            <p className="text-center text-sm text-slate-500 pt-6 border-t border-slate-50">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

