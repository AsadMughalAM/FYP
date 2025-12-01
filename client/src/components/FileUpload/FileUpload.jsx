import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const FileUpload = ({ onUploadSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("No authentication token found. Please sign in again.");
      }

      const formData = new FormData();
      formData.append("image", data.image[0]);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.post(
        `${API_BASE_URL}/animal/detect/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
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
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/signin";
      }
    },
  });

const onSubmit = (data) => {
  if (data.image && data.image.length > 0) {
    mutation.mutate(data); 
  }
};

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Input Area */}
        <div className="relative">
          <label className="block mb-4">
            <span className="text-lg font-semibold text-gray-700 mb-4 block">
              📸 Upload Animal Image
            </span>
            <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-8 hover:border-blue-500 transition cursor-pointer bg-blue-50">
              <input
                type="file"
                id="image"
                accept="image/*"
                {...register("image", {
                  required: "Please upload an image",
                  validate: {
                    fileSize: (files) => {
                      if (!files || !files[0]) return true;
                      return files[0].size <= 10 * 1024 * 1024 || "File size must be less than 10MB";
                    },
                    fileType: (files) => {
                      if (!files || !files[0]) return true;
                      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                      return allowedTypes.includes(files[0].type) || "Please upload a valid image file";
                    }
                  }
                })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center pointer-events-none">
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-lg font-semibold text-gray-700">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF (max 10MB)</p>
              </div>
            </div>
          </label>

          {errors.image && (
            <p className="text-red-600 text-sm font-semibold mt-3 flex items-center gap-2">
              <span>❌</span> {errors.image.message}
            </p>
          )}
        </div>

        {/* File Preview */}
        {mutation.variables && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-3">📁 Selected File</p>
            <p className="text-gray-800">{mutation.variables.image[0].name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {(mutation.variables.image[0].size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}

        {/* Submit Button */}

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`w-full py-3 rounded-lg font-bold text-white text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              mutation.isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
          }`}
        >
          {mutation.isPending ? (
            <>
              <span className="animate-spin">⏳</span>
              Analyzing Image...
            </>
          ) : (
            <>
              <span>🚀</span>
              Detect Disease
            </>
          )}
        </button>
  {/* Success Message */}

        {mutation.isSuccess && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-900">Detection Successful!</p>
              <p className="text-sm text-green-800">Check the Results tab to view the diagnosis.</p>
            </div>
            {/* Error Message */}
          </div>
        )}

        {mutation.isError && (
          <div className="space-y-4">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="flex-1">
                <p className="font-bold text-red-900">Upload Failed</p>
                <p className="text-sm text-red-800 mt-1">
                  {mutation.error?.response?.status === 401 
                    ? "Authentication failed. Please sign in again."
                    : mutation.error?.response?.data?.error || mutation.error?.message || "An error occurred during upload. Please try again."}
                </p>
                {mutation.error?.response?.status === 401 && (
                  <button
                    onClick={() => window.location.href = "/signin"}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Go to Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Use clear, well-lit images</li>
                <li>✓ Ensure the affected area is visible</li>
                <li>✓ Avoid blurry or dark photos</li>
                <li>✓ Take image from multiple angles if possible</li>
              </ul>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default FileUpload;
