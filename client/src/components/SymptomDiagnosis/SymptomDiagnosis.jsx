import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const SymptomDiagnosis = ({ onDiagnosisSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  const commonSymptoms = [
    "Lameness",
    "Swelling",
    "Fever",
    "Loss of Appetite",
    "Lethargy",
    "Coughing",
    "Nasal Discharge",
    "Eye Discharge",
    "Diarrhea",
    "Vomiting",
    "Difficulty Breathing",
    "Abnormal Gait",
    "Skin Lesions",
    "Hair Loss",
    "Weight Loss",
    "Excessive Drooling",
    "Reduced Milk Production",
    "Abnormal Behavior",
    "Joint Stiffness",
    "Foot Problems",
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("No authentication token found. Please sign in again.");
      }

      const formData = {
        symptoms: selectedSymptoms,
        animal_name: data.animal_name || "Unknown",
        animal_age: data.animal_age || null,
        notes: data.notes || "",
      };

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.post(
        `${API_BASE_URL}/animal/symptom-diagnosis/`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (onDiagnosisSuccess && data.data) {
        onDiagnosisSuccess(data.data);
      }
      reset();
      setSelectedSymptoms([]);
    },
    onError: (error) => {
      console.error("Diagnosis failed:", error);
    },
  });

  const onSubmit = (data) => {
    if (selectedSymptoms.length === 0) {
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1.5">Symptom-Based Diagnosis</h2>
        <p className="text-sm text-gray-600">
          Select the symptoms you've observed in your animal to get a preliminary diagnosis
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Animal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Animal Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                {...register("animal_name")}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                placeholder="e.g., Daisy, Buddy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Animal Age <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="number"
                {...register("animal_age")}
                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                placeholder="Age in months"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Select Symptoms{" "}
            <span className="text-xs font-normal text-gray-500">
              ({selectedSymptoms.length} selected)
            </span>
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            Click on symptoms you've observed. Select multiple symptoms for better accuracy.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {commonSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>

          {selectedSymptoms.length === 0 && (
            <p className="text-red-600 text-xs mt-3 flex items-center gap-1.5">
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
              Please select at least one symptom
            </p>
          )}

          {selectedSymptoms.length > 0 && (
            <div className="mt-4 p-3.5 bg-blue-50/50 rounded-lg border border-blue-200/60">
              <p className="text-xs font-medium text-blue-900 mb-2">
                Selected Symptoms:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedSymptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-xs font-medium"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      className="hover:text-blue-200 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200/60 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Notes</h3>
          <textarea
            {...register("notes")}
            rows={4}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition resize-none"
            placeholder="Add any additional observations, duration of symptoms, or other relevant information..."
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || selectedSymptoms.length === 0}
          className={`w-full py-3 rounded-lg text-sm font-medium text-white transition-all duration-150 flex items-center justify-center gap-2 ${
            mutation.isPending || selectedSymptoms.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow"
          }`}
        >
          {mutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Analyzing Symptoms...
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
              Get Diagnosis
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
              <p className="text-sm font-medium text-green-900">Diagnosis Successful!</p>
              <p className="text-xs text-green-800 mt-0.5">
                Check the results tab to view the diagnosis details.
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
              <p className="text-sm font-medium text-red-900">Diagnosis Failed</p>
              <p className="text-xs text-red-800 mt-0.5">
                {mutation.error?.response?.data?.error ||
                  mutation.error?.message ||
                  "An error occurred. Please try again."}
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

export default SymptomDiagnosis;

