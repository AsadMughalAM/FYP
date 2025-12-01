import React, { useEffect, useState } from "react";

const DiseaseResults = ({ detection, refreshTrigger }) => {
  const [result, setResult] = useState(detection);

  useEffect(() => {
    if (detection) {
      setResult(detection);
    }
  }, [detection, refreshTrigger]);

  if (!result) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Detection Results</h3>
        <p className="text-gray-500">Upload an image first to see diagnosis results</p>
      </div>
    );
  }

  const severity_colors = {
    None: "bg-green-100 text-green-800 border-green-300",
    Low: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Medium: "bg-orange-100 text-orange-800 border-orange-300",
    High: "bg-red-100 text-red-800 border-red-300",
    Critical: "bg-red-200 text-red-900 border-red-400"
  };

  const severity_bg = {
    None: "bg-green-50",
    Low: "bg-yellow-50",
    Medium: "bg-orange-50",
    High: "bg-red-50",
    Critical: "bg-red-100"
  };

  return (
    <div className="space-y-5">
      {/* AI-Powered Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200/60">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs font-medium text-purple-700">AI-Powered Diagnosis</span>
        </div>
        {/* Data Source Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200/60">
          <span className="text-xs font-medium text-green-700">🔄 REAL-TIME</span>
          <span className="text-xs text-green-600">Gemini API</span>
        </div>
      </div>

      {/* Disease Summary Card */}
      <div className={`rounded-lg border p-6 ${severity_colors[result.severity] || severity_colors.Medium}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-semibold mb-1.5">
              {result.disease_name || "Unknown Disease"}
            </h3>
            <p className="text-sm opacity-90">
              Animal: <span className="font-medium">{result.animal_name || "Unknown"}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold opacity-90">
              {(result.confidence_score * 100).toFixed(1)}%
            </p>
            <p className="text-xs opacity-75">Confidence</p>
          </div>
        </div>

        {/* Severity Badge */}
        <div className="inline-block">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium">
            🚨 Severity: {result.severity || "Unknown"}
          </span>
        </div>
      </div>

      {/* Image Preview */}
      {result.image && (
        <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/60">
          <p className="text-xs font-medium text-gray-600 mb-2.5">Uploaded Image</p>
          <img
            src={result.image}
            alt="Animal"
            className="w-full max-h-80 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}

      {/* Prediction Confidence */}
      {result.all_predictions && Object.keys(result.all_predictions).length > 0 && (
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200/60">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">📊 Model Predictions</h4>
          <div className="space-y-2.5">
            {Object.entries(result.all_predictions)
              .sort((a, b) => b[1] - a[1])
              .map(([disease, confidence], index) => (
                <div key={disease}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-blue-900">{disease}</span>
                    <span className="text-xs font-semibold text-blue-700">
                      {(confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        disease.toLowerCase().replace(/\s+/g, ' ') === result.disease_name?.toLowerCase().replace(/\s+/g, ' ') ||
                        disease.toLowerCase().includes(result.disease_name?.toLowerCase() || '') ||
                        result.disease_name?.toLowerCase().includes(disease.toLowerCase())
                          ? "bg-blue-600"
                          : "bg-blue-400"
                      }`}
                      style={{ width: `${confidence * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Symptoms - From Gemini AI */}
      {result.symptoms && result.symptoms.length > 0 && (
        <div className="bg-yellow-50/50 rounded-lg p-5 border border-yellow-200/60">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-yellow-900">⚠️ Symptoms</h4>
            <span className="text-xs bg-yellow-200/60 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
              AI-Generated
            </span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.symptoms.map((symptom, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-yellow-600 text-sm mt-0.5">🔸</span>
                <span className="text-sm text-yellow-900">{symptom}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment - From Gemini AI */}
      {result.treatment && result.treatment.length > 0 && (
        <div className="bg-green-50/50 rounded-lg p-5 border border-green-200/60">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-green-900">💊 Treatment</h4>
            <span className="text-xs bg-green-200/60 text-green-800 px-2 py-0.5 rounded-full font-medium">
              AI-Generated
            </span>
          </div>
          <ol className="space-y-2">
            {result.treatment.map((treatment, index) => (
              <li key={index} className="flex gap-2.5">
                <span className="font-semibold text-green-600 shrink-0 text-sm">
                  {index + 1}.
                </span>
                <span className="text-sm text-green-900">{treatment}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Prevention - From Gemini AI */}
      {result.prevention && result.prevention.length > 0 && (
        <div className="bg-indigo-50/50 rounded-lg p-5 border border-indigo-200/60">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-indigo-900">🛡️ Prevention</h4>
            <span className="text-xs bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full font-medium">
              AI-Generated
            </span>
          </div>
          <ul className="space-y-2">
            {result.prevention.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-indigo-600 text-sm mt-0.5">✓</span>
                <span className="text-sm text-indigo-900">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Antibiotics - From Gemini AI */}
      {result.antibiotics && result.antibiotics.length > 0 && (
        <div className="bg-purple-50/50 rounded-lg p-5 border border-purple-200/60">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-semibold text-purple-900">💉 Recommended Antibiotics</h4>
            <span className="text-xs bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded-full font-medium">
              AI-Generated
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.antibiotics.map((antibiotic, index) => (
              <span
                key={index}
                className="bg-purple-200/60 text-purple-900 px-3 py-1 rounded-full text-xs font-medium"
              >
                {antibiotic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contagious Warning */}
      {result.contagious && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="flex items-start gap-2.5">
            <span className="text-xl">⚠️</span>
            <span className="text-sm font-medium text-red-900">
              This disease is contagious. Isolate the affected animal from others immediately.
            </span>
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-200/60 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">📅 Diagnosed: {new Date(result.created_at).toLocaleString()}</p>
            <p className="mt-1">🏥 Status: <span className="font-medium capitalize">{result.status || "diagnosed"}</span></p>
          </div>
          {result.notes && (
            <div className="text-right">
              <p className="font-medium">Notes:</p>
              <p className="text-xs">{result.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseResults;
