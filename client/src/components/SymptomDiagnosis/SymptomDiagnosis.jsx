import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import API_BASE_URL, { getAuthHeaders } from "../../config/api";

const SymptomDiagnosis = ({ onDiagnosisSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [diagnosisResults, setDiagnosisResults] = useState(null);

  console.log("🔵 SymptomDiagnosis component rendered");
  console.log("🔵 Selected symptoms:", selectedSymptoms);
  console.log("🔵 Diagnosis results:", diagnosisResults);

  const { data: symptomsData, isLoading: symptomsLoading, error: symptomsError } = useQuery({
    queryKey: ['symptoms'],
    queryFn: async () => {
      console.log("🟢 Fetching symptoms from API...");
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("❌ No authentication token found");
        throw new Error("No authentication token found");
      }
      
      try {
        const url = `${API_BASE_URL}/symptoms/`;
        console.log("🟢 GET request to:", url);
        console.log("🟢 Headers:", getAuthHeaders());
        
        const response = await axios.get(url, { headers: getAuthHeaders() });
        console.log("✅ Symptoms fetched successfully:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error fetching symptoms:", error);
        console.error("❌ Error response:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);
        throw error;
      }
    },
    retry: 1,
    onError: (error) => {
      console.error("❌ useQuery error for symptoms:", error);
    }
  });

  const availableSymptoms = symptomsData?.symptoms || [];

  const toggleSymptom = (symptom) => {
    console.log("🟡 Toggling symptom:", symptom);
    setSelectedSymptoms((prev) => {
      const newSymptoms = prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom];
      console.log("🟡 Updated symptoms:", newSymptoms);
      return newSymptoms;
    });
  };

  const mutation = useMutation({
    mutationFn: async (formData) => {
      console.log("🟢 ========== DIAGNOSIS REQUEST START ==========");
      console.log("🟢 Form data received:", formData);
      console.log("🟢 Selected symptoms:", selectedSymptoms);
      
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        console.error("❌ No authentication token found");
        throw new Error("No authentication token found. Please sign in again.");
      }

      const requestPayload = {
        symptoms: selectedSymptoms,
        animal_name: formData?.animal_name || '',
        animal_age: formData?.animal_age || null,
        notes: formData?.notes || '',
      };

      console.log("🟢 Request payload:", requestPayload);
      console.log("🟢 Payload type:", typeof requestPayload);
      console.log("🟢 Symptoms array:", Array.isArray(requestPayload.symptoms));
      console.log("🟢 Symptoms count:", requestPayload.symptoms.length);

      const url = `${API_BASE_URL}/diagnose/`;
      const headers = getAuthHeaders();
      
      console.log("🟢 POST request to:", url);
      console.log("🟢 Headers:", headers);
      console.log("🟢 Payload:", JSON.stringify(requestPayload, null, 2));

      try {
        const response = await axios.post(url, requestPayload, { headers });
        console.log("✅ ========== DIAGNOSIS SUCCESS ==========");
        console.log("✅ Response status:", response.status);
        console.log("✅ Response data:", response.data);
        console.log("✅ Response data type:", typeof response.data);
        console.log("✅ Results count:", response.data?.results?.length || 0);
        return response.data;
      } catch (error) {
        console.error("❌ ========== DIAGNOSIS ERROR ==========");
        console.error("❌ Error object:", error);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error response:", error.response);
        console.error("❌ Error response data:", error.response?.data);
        console.error("❌ Error response status:", error.response?.status);
        console.error("❌ Error response headers:", error.response?.headers);
        
        if (error.response) {
          console.error("❌ Full error response:", JSON.stringify(error.response.data, null, 2));
        }
        
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log("✅ Mutation onSuccess called");
      console.log("✅ Success data:", data);
      console.log("✅ Variables (formData):", variables);
      console.log("✅ Results:", data?.results);
      console.log("✅ Results length:", data?.results?.length);
      
      if (data && data.results && data.results.length > 0) {
        console.log("✅ Setting diagnosisResults with data:", data);
        console.log("✅ Diagnosis saved:", data.saved);
        console.log("✅ Diagnosis ID:", data.diagnosis_id);
        console.log("✅ Saved diagnosis data:", data.saved_diagnosis);
        
        setDiagnosisResults(data);
        console.log("✅ diagnosisResults state updated");
        
        // Use saved diagnosis data if available, otherwise transform the best result
        let transformedDetection;
        
        if (data.saved_diagnosis) {
          // Use the saved diagnosis data from database
          console.log("✅ Using saved diagnosis data from database");
          transformedDetection = {
            id: data.saved_diagnosis.id,
            disease_name: data.saved_diagnosis.disease_name || "Unknown Disease",
            confidence_score: data.saved_diagnosis.confidence_score || 0,
            severity: data.saved_diagnosis.severity || "Unknown",
            symptoms: data.saved_diagnosis.matched_symptoms || [],
            treatment: data.saved_diagnosis.treatment || [],
            prevention: data.saved_diagnosis.prevention || [],
            antibiotics: data.saved_diagnosis.medicines || [],
            contagious: data.saved_diagnosis.contagious || false,
            created_at: data.saved_diagnosis.created_at,
            status: data.saved_diagnosis.status || "diagnosed",
            animal_name: data.saved_diagnosis.animal_name || "Unknown",
            all_predictions: (data.saved_diagnosis.all_results || []).reduce((acc, result) => {
              acc[result.disease_name] = result.confidence;
              return acc;
            }, {})
          };
        } else {
          // Fallback: transform the best result
          console.log("⚠️ No saved diagnosis data, using transformed result");
          const bestResult = data.results[0];
          transformedDetection = {
            disease_name: bestResult.disease_name || "Unknown Disease",
            confidence_score: bestResult.confidence || 0,
            severity: bestResult.severity || "Unknown",
            symptoms: bestResult.matched_symptoms || [],
            treatment: bestResult.treatment || [],
            prevention: bestResult.prevention || [],
            antibiotics: bestResult.medicines || [],
            contagious: bestResult.contagious || false,
            created_at: new Date().toISOString(),
            status: "diagnosed",
            animal_name: variables?.animal_name || "Unknown",
            all_predictions: data.results.reduce((acc, result) => {
              acc[result.disease_name] = result.confidence;
              return acc;
            }, {})
          };
        }
        
        console.log("✅ Transformed detection for DiseaseResults:", transformedDetection);
        
        if (onDiagnosisSuccess) {
          console.log("✅ Calling onDiagnosisSuccess callback with transformed data");
          onDiagnosisSuccess(transformedDetection);
        }
      } else {
        console.warn("⚠️ No results in response:", { data, hasResults: !!data?.results });
        setDiagnosisResults(data || { results: [], message: "No results returned" });
      }
    },
    onError: (error) => {
      console.error("❌ Mutation onError called");
      console.error("❌ Error:", error);
      console.error("❌ Error response:", error.response);
      setDiagnosisResults(null);
    },
  });

  const onSubmit = (formData) => {
    console.log("🟡 ========== FORM SUBMIT ==========");
    console.log("🟡 Form data:", formData);
    console.log("🟡 Selected symptoms:", selectedSymptoms);
    console.log("🟡 Selected symptoms count:", selectedSymptoms.length);
    
    if (selectedSymptoms.length === 0) {
      console.warn("⚠️ No symptoms selected, aborting submit");
      return;
    }
    
    console.log("🟡 Calling mutation.mutate()");
    mutation.mutate(formData);
  };

  useEffect(() => {
    console.log("🟡 Diagnosis results changed:", diagnosisResults);
    console.log("🟡 Diagnosis results type:", typeof diagnosisResults);
    console.log("🟡 Has results property:", !!diagnosisResults?.results);
    console.log("🟡 Results is array:", Array.isArray(diagnosisResults?.results));
    console.log("🟡 Results length:", diagnosisResults?.results?.length);
    console.log("🟡 Will render results:", diagnosisResults && diagnosisResults.results && diagnosisResults.results.length > 0);
  }, [diagnosisResults]);

  useEffect(() => {
    console.log("🟡 Selected symptoms changed:", selectedSymptoms);
  }, [selectedSymptoms]);

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

          {symptomsLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="text-xs text-gray-600 mt-2">Loading symptoms...</p>
            </div>
          )}

          {symptomsError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Could not load symptoms from server</p>
              <p className="text-xs text-yellow-700">
                Error: {symptomsError?.response?.data?.message || symptomsError?.message || "Unknown error"}
              </p>
            </div>
          )}

          {availableSymptoms.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {availableSymptoms.map((symptom) => {
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
          ) : !symptomsLoading && (
            <div className="text-center py-4 text-gray-500 text-sm">
              No symptoms available. Please check your connection.
            </div>
          )}

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
                Selected Symptoms ({selectedSymptoms.length}):
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
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Diagnosis Successful!</p>
              <p className="text-xs text-green-800 mt-0.5">
                {diagnosisResults?.message || "Check results below"}
              </p>
              {diagnosisResults?.results && (
                <p className="text-xs text-green-700 mt-1">
                  Found {diagnosisResults.results.length} result(s)
                </p>
              )}
              {diagnosisResults?.saved && (
                <div className="mt-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs text-green-700 font-medium">
                    Diagnosis saved to history (ID: {diagnosisResults.diagnosis_id})
                  </p>
                </div>
              )}
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
                  mutation.error?.response?.data?.message ||
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
              <details className="mt-2">
                <summary className="text-xs text-red-700 cursor-pointer">Show error details</summary>
                <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto">
                  {JSON.stringify(mutation.error?.response?.data || mutation.error, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </form>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300 text-xs">
          <p className="font-bold mb-2">🔍 Debug Info:</p>
          <p>mutation.isSuccess: {String(mutation.isSuccess)}</p>
          <p>mutation.isPending: {String(mutation.isPending)}</p>
          <p>mutation.isError: {String(mutation.isError)}</p>
          <p>diagnosisResults exists: {String(!!diagnosisResults)}</p>
          <p>diagnosisResults.results exists: {String(!!diagnosisResults?.results)}</p>
          <p>diagnosisResults.results is array: {String(Array.isArray(diagnosisResults?.results))}</p>
          <p>diagnosisResults.results.length: {diagnosisResults?.results?.length || 0}</p>
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">Show diagnosisResults</summary>
            <pre className="mt-1 p-2 bg-white rounded overflow-auto max-h-40">
              {JSON.stringify(diagnosisResults, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Diagnosis Results Section */}
      {diagnosisResults && diagnosisResults.results && Array.isArray(diagnosisResults.results) && diagnosisResults.results.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Diagnosis Results</h3>
            <button
              onClick={() => {
                console.log("🟡 Clearing diagnosis results");
                setDiagnosisResults(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Results
            </button>
          </div>

          {diagnosisResults.results.map((result, index) => (
            <DiseaseResultCard key={index} result={result} />
          ))}
        </div>
      )}

      {diagnosisResults && diagnosisResults.results && diagnosisResults.results.length === 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Matching Diseases Found</h3>
          <p className="text-sm text-yellow-800 mb-4">
            {diagnosisResults.suggestions || "Try selecting different symptoms or check spelling."}
          </p>
          <p className="text-xs text-yellow-700">
            Input symptoms: {diagnosisResults.input_symptoms?.join(", ") || "N/A"}
          </p>
        </div>
      )}
    </div>
  );
};

const DiseaseResultCard = ({ result }) => {
  const severityColors = {
    None: "bg-green-100 text-green-800 border-green-300",
    Low: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Medium: "bg-orange-100 text-orange-800 border-orange-300",
    High: "bg-red-100 text-red-800 border-red-300",
    Critical: "bg-red-200 text-red-900 border-red-400",
    Unknown: "bg-gray-100 text-gray-800 border-gray-300"
  };

  const severity = result.severity || "Unknown";
  const confidencePercent = ((result.confidence || 0) * 100).toFixed(1);
  const matchRate = result.match_rate || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-5 ${severityColors[severity] || severityColors.Unknown}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-xl font-semibold mb-1">{result.disease_name || "Unknown Disease"}</h4>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-medium px-2 py-1 bg-white/30 rounded-full">
                🚨 Severity: {severity}
              </span>
              {result.contagious && (
                <span className="text-xs font-medium px-2 py-1 bg-red-500/30 rounded-full">
                  ⚠️ Contagious
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{confidencePercent}%</div>
            <div className="text-xs opacity-75">Confidence</div>
            <div className="text-xs mt-1 opacity-75">Match: {matchRate}%</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Matched Symptoms */}
        {result.matched_symptoms && result.matched_symptoms.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">✅ Matched Symptoms</h5>
            <div className="flex flex-wrap gap-1.5">
              {result.matched_symptoms.map((symptom, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Treatment */}
        {result.treatment && result.treatment.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h5 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
              💊 Treatment
            </h5>
            <ol className="space-y-1.5">
              {result.treatment.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-green-900">
                  <span className="font-semibold text-green-600">{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Medicines */}
        {result.medicines && result.medicines.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h5 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
              💉 Recommended Medicines
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {result.medicines.map((medicine, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-200 text-purple-900 rounded-full text-xs font-medium"
                >
                  {medicine}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prevention */}
        {result.prevention && result.prevention.length > 0 && (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <h5 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              🛡️ Prevention Steps
            </h5>
            <ul className="space-y-1.5">
              {result.prevention.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-indigo-900">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">Match Confidence</span>
            <span className="text-xs font-semibold text-gray-900">{confidencePercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                parseFloat(confidencePercent) >= 70
                  ? "bg-green-500"
                  : parseFloat(confidencePercent) >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${confidencePercent}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomDiagnosis;
