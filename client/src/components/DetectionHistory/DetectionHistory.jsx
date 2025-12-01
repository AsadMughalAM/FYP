import React, { useEffect, useState } from "react";
import axios from "axios";

const DetectionHistory = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.get(`${API_BASE_URL}/animal/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out blackleg, mastitis, bloat, and foot rot - keep only foot-and-mouth, lumpy, and healthy
      const excludedDiseases = ['blackleg', 'mastitis', 'bloat', 'foot rot', 'footrot', 'foot_rot', 'foot-rot'];
      const filteredHistory = (response.data.data || []).filter((detection) => {
        if (!detection.disease_name) return true;
        const lowerName = detection.disease_name.toLowerCase();
        return !excludedDiseases.some(excluded => lowerName.includes(excluded));
      });
      
      setHistory(filteredHistory);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      None: "bg-green-100 text-green-800",
      Low: "bg-yellow-100 text-yellow-800",
      Medium: "bg-orange-100 text-orange-800",
      High: "bg-red-100 text-red-800",
      Critical: "bg-red-200 text-red-900"
    };
    return colors[severity] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      diagnosed: "🔍",
      treated: "💊",
      recovered: "✅",
      pending: "⏳"
    };
    return icons[status] || "📋";
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin">🔄</div>
        <p className="text-gray-600 mt-2">Loading detection history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">No Detection History</h3>
        <p className="text-gray-500">Start by uploading an animal image to get your first diagnosis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">
          Detection History ({history.length})
        </h3>
        <button
          onClick={fetchHistory}
          className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto rounded-lg border border-gray-200/60">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b border-gray-200/60">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Date</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Disease</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Confidence</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Severity</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60">
            {history.map((detection) => (
              <tr key={detection.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                  {new Date(detection.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-900">
                  {detection.disease_name}
                </td>
                <td className="px-4 py-3 text-xs text-gray-700">
                  <div className="w-20 bg-gray-200/60 rounded-full h-1.5 mb-1">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${detection.confidence_score * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600">
                    {(detection.confidence_score * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(detection.severity)}`}>
                    {detection.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="flex items-center gap-1">
                    {getStatusIcon(detection.status)}
                    <span className="capitalize">{detection.status}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  <button
                    onClick={() => setSelectedId(selectedId === detection.id ? null : detection.id)}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    {selectedId === detection.id ? "Hide" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed View */}
      {selectedId && (
        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-200/60 mt-4">
          {history
            .filter((d) => d.id === selectedId)
            .map((detection) => (
              <div key={detection.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-blue-900">{detection.disease_name}</h4>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {detection.image && (
                  <img
                    src={detection.image}
                    alt="Animal"
                    className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-200/60">
                    <p className="text-xs text-gray-600 mb-1">Confidence</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {(detection.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200/60">
                    <p className="text-xs text-gray-600 mb-1">Severity</p>
                    <p className="text-xl font-semibold text-red-600">{detection.severity}</p>
                  </div>
                </div>

                {detection.symptoms && detection.symptoms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-blue-900">Symptoms:</p>
                      <span className="text-xs bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded-full">AI-Generated</span>
                    </div>
                    <ul className="space-y-1">
                      {detection.symptoms.map((symptom, idx) => (
                        <li key={idx} className="text-xs text-blue-800">• {symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detection.treatment && detection.treatment.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-blue-900">Treatment:</p>
                      <span className="text-xs bg-green-200/60 text-green-800 px-2 py-0.5 rounded-full">AI-Generated</span>
                    </div>
                    <ol className="space-y-1 list-decimal list-inside">
                      {detection.treatment.map((treatment, idx) => (
                        <li key={idx} className="text-xs text-blue-800">{treatment}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {detection.prevention && detection.prevention.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-blue-900">Prevention:</p>
                      <span className="text-xs bg-indigo-200/60 text-indigo-800 px-2 py-0.5 rounded-full">AI-Generated</span>
                    </div>
                    <ul className="space-y-1">
                      {detection.prevention.map((item, idx) => (
                        <li key={idx} className="text-xs text-blue-800">✓ {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detection.antibiotics && detection.antibiotics.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-medium text-blue-900">Antibiotics:</p>
                      <span className="text-xs bg-purple-200/60 text-purple-800 px-2 py-0.5 rounded-full">AI-Generated</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detection.antibiotics.map((antibiotic, idx) => (
                        <span key={idx} className="text-xs bg-purple-100/60 text-purple-800 px-2 py-1 rounded-full">
                          {antibiotic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {detection.contagious && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-900">⚠️ Contagious Disease - Isolate immediately</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;
