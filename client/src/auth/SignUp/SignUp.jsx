import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const res = await axios.post(`${API_BASE_URL}/register/`, {
        username: data.username,
        email: data.email,
        password: data.password
      });
      return res.data;
    },
    onSuccess: () => {
      alert("User created successfully! Please login.");
      navigate("/signin");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm w-full max-w-md p-8 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">Sign Up</h2>
          <p className="text-center text-sm text-gray-600">Create your account to get started!</p>
        </div>

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm text-center p-3 rounded-lg mb-6">
            {JSON.stringify(apiError)}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              {...register("username", { required: "Username is required" })}
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 ${
                errors.username 
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-blue-100 focus:border-blue-400"
              }`}
            />
            {errors.username && (
              <p className="text-red-600 text-xs mt-1.5 ml-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email"
              {...register("email", { required: "Email is required" })}
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 ${
                errors.email 
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-blue-100 focus:border-blue-400"
              }`}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1.5 ml-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password", { required: "Password is required", minLength: 8 })}
              className={`w-full px-4 py-2.5 text-sm rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 ${
                errors.password 
                  ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                  : "border-gray-300 focus:ring-blue-100 focus:border-blue-400"
              }`}
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1.5 ml-1">{errors.password.message}</p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-150"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 pt-6 border-t border-gray-200">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
