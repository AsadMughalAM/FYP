import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const ImageDiagnosis = ({ onUploadSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [preview, setPreview] = useState(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1.5">Image-Based Diagnosis</h2>
        <p className="text-sm text-gray-600">
          Upload a clear image of the affected animal area for AI-powered disease detection
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200/60 p-6">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-3 block">
              Upload Animal Image
            </span>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-10 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50/50 hover:bg-blue-50/50">
              <input
                type="file"
                id="image"
                accept="image/*"
                {...register("image", {
                  required: "Please upload an image",
                  validate: {
                    fileSize: (files) => {
                      if (!files || !files[0]) return true;
                      return (
                        files[0].size <= 10 * 1024 * 1024 ||
                        "File size must be less than 10MB"
                      );
                    },
                    fileType: (files) => {
                      if (!files || !files[0]) return true;
                      const allowedTypes = [
                        "image/jpeg",
                        "image/png",
                        "image/gif",
                        "image/webp",
                      ];
                      return (
                        allowedTypes.includes(files[0].type) ||
                        "Please upload a valid image file (JPG, PNG, GIF, or WEBP)"
                      );
                    },
                  },
                })}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center pointer-events-none">
                {preview ? (
                  <div className="space-y-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-56 mx-auto rounded-lg shadow-sm object-cover border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 text-center">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1.5">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, or WEBP (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </label>

          {errors.image && (
            <p className="text-red-600 text-xs font-medium mt-3 flex items-center gap-1.5">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {errors.image.message}
            </p>
          )}
        </div>

        <div className="bg-blue-50/50 rounded-lg border border-blue-200/60 p-5">
          <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tips for Best Results
          </h4>
          <ul className="text-xs text-blue-800 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Use clear, well-lit images with good focus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Ensure the affected area is clearly visible</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Avoid blurry, dark, or shadowed photos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>Take images from multiple angles if possible</span>
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className={`w-full py-3 rounded-lg text-sm font-medium text-white transition-all duration-150 flex items-center justify-center gap-2 ${
            mutation.isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow"
          }`}
        >
          {mutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Analyzing Image...
            </>
          ) : (
            <>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Detect Disease
            </>
          )}
        </button>

        {mutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">Detection Successful!</p>
              <p className="text-xs text-green-800 mt-0.5">
                Check the Results tab to view the diagnosis details.
              </p>
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Upload Failed</p>
              <p className="text-xs text-red-800 mt-0.5">
                {mutation.error?.response?.status === 401
                  ? "Authentication failed. Please sign in again."
                  : mutation.error?.response?.data?.error ||
                    mutation.error?.message ||
                    "An error occurred during upload. Please try again."}
              </p>
              {mutation.error?.response?.status === 401 && (
                <button
                  type="button"
                  onClick={() => (window.location.href = "/signin")}
                  className="mt-2.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ImageDiagnosis;

