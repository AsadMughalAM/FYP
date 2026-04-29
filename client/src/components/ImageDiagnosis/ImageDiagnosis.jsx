import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Zap, 
  ShieldCheck, 
  Lightbulb,
  Search,
  RefreshCw,
  Camera
} from "lucide-react";

const ImageDiagnosis = ({ onUploadSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [preview, setPreview] = useState(null);
  const selectedImage = watch("image");

  const mutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Session expired. Please sign in again.");

      const formData = new FormData();
      formData.append("image", data.image[0]);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.post(
        `${API_BASE_URL}/animal/detect/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (onUploadSuccess && data.data) {
        onUploadSuccess(data.data);
      }
      reset();
      setPreview(null);
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/signin";
      }
    },
  });

  const onSubmit = (data) => {
    if (data.image && data.image.length > 0) {
      mutation.mutate(data);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setValue("image", null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="mb-10 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Zap size={20} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Neural Image Diagnostics</h2>
        </div>
        <p className="text-slate-500 max-w-2xl leading-relaxed">
          Leverage advanced neural networks to identify animal diseases from photos. 
          Our AI analyzes texture, color patterns, and anatomical markers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className={`relative group transition-all duration-500 ${mutation.isPending ? 'opacity-80 pointer-events-none' : ''}`}>
              {!preview ? (
                <label className="block cursor-pointer">
                  <div className="relative border-2 border-dashed border-slate-200 rounded-[2rem] p-12 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      {...register("image", { 
                        required: "Image is required",
                        onChange: handleFileChange 
                      })}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500">
                        <Upload size={32} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">Drop your image here</h4>
                      <p className="text-sm text-slate-500 mb-6">or click to browse from device</p>
                      
                      <div className="flex flex-wrap justify-center gap-3">
                        <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-slate-400 uppercase border border-slate-100">JPG</span>
                        <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-slate-400 uppercase border border-slate-100">PNG</span>
                        <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-slate-400 uppercase border border-slate-100">WEBP</span>
                      </div>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-2xl shadow-slate-900/5 group">
                  <div className="aspect-[4/3] w-full relative">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    
                    {/* Scanning Animation */}
                    {mutation.isPending && (
                      <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[1px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                            <RefreshCw className="animate-spin text-blue-600" size={20} />
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Processing...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={clearImage}
                      className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur hover:bg-red-50 hover:text-red-600 rounded-xl shadow-lg transition-all active:scale-90"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errors.image && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                <span className="text-xs font-bold">{errors.image.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!preview || mutation.isPending}
              className={`w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-[0.98] ${
                !preview || mutation.isPending
                  ? "bg-slate-100 text-slate-400"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20"
              }`}
            >
              {mutation.isPending ? (
                <>Analyzing Matrix...</>
              ) : (
                <>
                  <Search size={20} />
                  Initiate Analysis
                </>
              )}
            </button>
          </form>

          {/* Feedback Section */}
          {mutation.isError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 animate-in fade-in">
              <AlertCircle className="text-red-600 shrink-0" size={20} />
              <div>
                <h5 className="text-sm font-bold text-red-900">Analysis Halted</h5>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                  {mutation.error?.response?.data?.error || mutation.error?.message || "An unexpected error occurred. Please try again."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Guidance Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold">Preparation Guide</h3>
              </div>
              
              <div className="space-y-5">
                {[
                  { title: "Lighting", desc: "Ensure natural or bright indoor lighting", icon: <Lightbulb size={18} /> },
                  { title: "Focus", desc: "Center the affected area clearly", icon: <Search size={18} /> },
                  { title: "Clarity", desc: "Avoid blurry or shaky captures", icon: <Camera size={18} /> },
                  { title: "Verification", desc: "AI diagnosis requires veterinary review", icon: <CheckCircle2 size={18} /> },
                ].map((tip, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-blue-400 transition-colors">
                      {tip.icon}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white/90">{tip.title}</h5>
                      <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RefreshCw size={16} className="text-blue-600" />
              Recent Success Rates
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dermal Conditions</span>
                <span className="text-xs font-bold text-emerald-600">94% Accuracy</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[94%]"></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Eye Infections</span>
                <span className="text-xs font-bold text-blue-600">89% Accuracy</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[89%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0.8; }
        }
      `}} />
    </div>
  );
};

export default ImageDiagnosis;


