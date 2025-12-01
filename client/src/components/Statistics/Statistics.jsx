import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import CustomTooltip from "../Dashboard/CustomTooltip";

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.get(`${API_BASE_URL}/animal/statistics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_detections === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-block p-6 bg-blue-50 rounded-full mb-4">
          <svg
            className="w-16 h-16 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Make some detections to see statistics</p>
      </div>
    );
  }

  // Filter out blackleg, mastitis, bloat, and foot rot - keep only foot-and-mouth, lumpy, and healthy
  const excludedDiseases = ['blackleg', 'mastitis', 'bloat', 'foot rot', 'footrot', 'foot_rot', 'foot-rot'];
  const diseaseData = Object.entries(stats.disease_distribution || {})
    .filter(([name]) => {
      const lowerName = name.toLowerCase();
      return !excludedDiseases.some(excluded => lowerName.includes(excluded));
    })
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: name.length > 20 ? name.substring(0, 20) + "..." : name,
      value: count,
      fullName: name,
      percentage: ((count / stats.total_detections) * 100).toFixed(1),
    }));

  // Status data with colors, icons, and percentage
  const statusConfig = {
    diagnosed: { color: "#3b82f6", icon: "🔍", label: "Diagnosed" },
    treated: { color: "#f59e0b", icon: "💊", label: "Treated" },
    recovered: { color: "#10b981", icon: "✅", label: "Recovered" },
    pending: { color: "#6b7280", icon: "⏳", label: "Pending" },
  };

  const statusData = Object.entries(stats.status_distribution || {})
    .map(([name, value]) => {
      const config = statusConfig[name.toLowerCase()] || { 
        color: "#8b5cf6", 
        icon: "📋", 
        label: name.charAt(0).toUpperCase() + name.slice(1) 
      };
      return {
        name: config.label,
        value,
        percentage: stats.total_detections > 0 
          ? ((value / stats.total_detections) * 100).toFixed(1) 
          : "0",
        color: config.color,
        icon: config.icon,
        originalName: name,
      };
    })
    .sort((a, b) => {
      // Sort by status priority
      const order = { diagnosed: 1, treated: 2, recovered: 3, pending: 4 };
      return (order[a.originalName.toLowerCase()] || 99) - (order[b.originalName.toLowerCase()] || 99);
    });

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Statistics</h2>
          <p className="text-gray-600 mt-1">Detailed analytics and insights</p>
        </div>
        <button
          onClick={fetchStatistics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-semibold">Total Detections</p>
              <p className="text-4xl font-bold mt-2">{stats.total_detections}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-semibold">Avg. Confidence</p>
              <p className="text-4xl font-bold mt-2">
                {(stats.average_confidence * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <svg
                className="w-8 h-8"
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
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-semibold">Diseases Detected</p>
              <p className="text-4xl font-bold mt-2">
                {Object.keys(stats.disease_distribution || {}).length}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Disease Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={diseaseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  if (percent < 0.05) return "";
                  return `${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={110}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {diseaseData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                formatter={(value, name, props) => {
                  const fullName = props.payload?.fullName || props.payload?.name;
                  const percentage = props.payload?.percentage || ((value / stats.total_detections) * 100).toFixed(1);
                  return [`${fullName || name}: ${value} (${percentage}%)`, name];
                }}
                animationDuration={200}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {diseaseData.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-700 font-medium">{item.fullName}</span>
                </div>
                <span className="text-gray-600 font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Status Distribution</h3>
            <div className="text-sm text-gray-500">Total: {stats.total_detections}</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={statusData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                {statusData.map((item, index) => (
                  <linearGradient key={`statusGradientStats${index}`} id={`statusGradientStats${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#374151" }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#374151" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 text-gray-800 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{data.icon}</span>
                          <p className="font-semibold">{data.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-600">
                            Count: <span className="font-bold text-gray-900">{data.value}</span>
                          </p>
                          <p className="text-gray-600">
                            Percentage: <span className="font-bold text-gray-900">{data.percentage}%</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
                animationDuration={200}
              />
              <Bar
                dataKey="value"
                radius={[12, 12, 0, 0]}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#statusGradientStats${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Status Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-700">
                  {item.icon} {item.name}: <span className="font-semibold">{item.value}</span> ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Disease Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(stats.disease_distribution || {})
            .sort((a, b) => b[1] - a[1])
            .map(([disease, count], index) => {
              const percentage = (count / stats.total_detections) * 100;
              return (
                <div key={disease} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{disease}</span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Status Overview</h3>
          <div className="space-y-3">
            {Object.entries(stats.status_distribution || {}).map(([status, count], index) => {
              const colors = {
                diagnosed: "bg-blue-100 text-blue-800 border-blue-300",
                treated: "bg-yellow-100 text-yellow-800 border-yellow-300",
                recovered: "bg-green-100 text-green-800 border-green-300",
                pending: "bg-gray-100 text-gray-800 border-gray-300",
              };
              const icons = {
                diagnosed: "🔍",
                treated: "💊",
                recovered: "✅",
                pending: "⏳",
              };
              return (
                <div
                  key={status}
                  className={`p-4 rounded-lg border-2 flex items-center justify-between transition-all duration-300 hover:shadow-md ${colors[status] || "bg-gray-100"}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icons[status] || "📋"}</span>
                    <span className="font-semibold capitalize">{status}</span>
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Latest Activity</h3>
          {stats.latest_detection ? (
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <p className="text-sm text-gray-600 mb-2 font-medium">Most Recent Detection</p>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {new Date(stats.latest_detection).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(stats.latest_detection).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No detections yet</p>
          )}
        </div>
      </div>

      <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200 shadow-md">
        <h3 className="text-lg font-bold text-indigo-900 mb-3">Summary</h3>
        <p className="text-indigo-800">
          You have made <span className="font-bold">{stats.total_detections}</span> detections
          with an average confidence score of{" "}
          <span className="font-bold">{(stats.average_confidence * 100).toFixed(1)}%</span>. The
          most common disease detected is{" "}
          <span className="font-bold">
            {Object.entries(stats.disease_distribution || {}).sort((a, b) => b[1] - a[1])[0]?.[0] ||
              "N/A"}
          </span>
          .
        </p>
      </div>
    </div>
  );
};

export default Statistics;
