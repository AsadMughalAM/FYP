import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import CustomTooltip from "./CustomTooltip";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const [statsResponse, historyResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/animal/statistics/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/animal/history/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats(statsResponse.data);
      setHistory(historyResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Show user-friendly error message
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/signin";
      } else if (error.response?.status >= 500) {
        alert("Server error. Please try again later.");
      } else if (error.request) {
        alert("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
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
        <p className="text-gray-500 mb-6">Start making detections to see your dashboard analytics</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Refresh Dashboard
        </button>
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

  const timeSeriesData = history
    .slice()
    .reverse()
    .slice(-7)
    .map((item) => ({
      date: new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      timestamp: new Date(item.created_at).getTime(),
      confidence: parseFloat((item.confidence_score * 100).toFixed(1)),
      detections: 1,
    }))
    .reduce((acc, item) => {
      const existing = acc.find((x) => x.date === item.date);
      if (existing) {
        existing.detections += 1;
        existing.confidence =
          ((existing.confidence * (existing.detections - 1) + item.confidence) / existing.detections).toFixed(1);
      } else {
        acc.push(item);
      }
      return acc;
    }, [])
    .sort((a, b) => a.timestamp - b.timestamp);

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

  const severityCounts = history.reduce((acc, item) => {
    acc[item.severity] = (acc[item.severity] || 0) + 1;
    return acc;
  }, {});

  // Severity configuration with colors and icons
  const severityConfig = {
    None: { color: "#10b981", icon: "✅", label: "None" },
    Low: { color: "#f59e0b", icon: "⚠️", label: "Low" },
    Medium: { color: "#f97316", icon: "🔶", label: "Medium" },
    High: { color: "#ef4444", icon: "🔴", label: "High" },
    Critical: { color: "#dc2626", icon: "🚨", label: "Critical" },
  };

  const severityData = Object.entries(severityCounts)
    .map(([name, value]) => {
      const config = severityConfig[name] || { 
        color: "#6b7280", 
        icon: "❓", 
        label: name 
      };
      return {
        name: config.label,
        value,
        percentage: history.length > 0 
          ? ((value / history.length) * 100).toFixed(1) 
          : "0",
        color: config.color,
        icon: config.icon,
        originalName: name,
      };
    })
    .sort((a, b) => {
      // Sort by severity priority
      const order = { None: 1, Low: 2, Medium: 3, High: 4, Critical: 5 };
      return (order[a.originalName] || 99) - (order[b.originalName] || 99);
    });

  const diseaseTooltipFormatter = (value, name, props) => {
    const fullName = props.payload?.fullName || props.payload?.name;
    const percentage = props.payload?.percentage || ((value / stats.total_detections) * 100).toFixed(1);
    return [
      <div key="value" className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: props.color }}
        ></div>
        <span className="font-semibold">{fullName || name}</span>
      </div>,
      <div key="count" className="text-gray-600 text-sm mt-1">
        Count: <span className="font-bold text-gray-900">{value}</span>
      </div>,
      <div key="percent" className="text-gray-600 text-sm">
        Percentage: <span className="font-bold text-gray-900">{percentage}%</span>
      </div>,
    ];
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Analytics and insights for your animal health data</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-150 flex items-center gap-2"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200/60 p-5 hover:shadow-sm transition-shadow duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-600"
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
          <p className="text-xs text-gray-600 font-medium mb-1">Total Detections</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total_detections}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200/60 p-5 hover:shadow-sm transition-shadow duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600"
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
          <p className="text-xs text-gray-600 font-medium mb-1">Avg. Confidence</p>
          <p className="text-2xl font-semibold text-gray-900">
            {(stats.average_confidence * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200/60 p-5 hover:shadow-sm transition-shadow duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <svg
                className="w-5 h-5 text-purple-600"
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
          <p className="text-xs text-gray-600 font-medium mb-1">Diseases Detected</p>
          <p className="text-2xl font-semibold text-gray-900">
            {Object.keys(stats.disease_distribution || {}).length}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200/60 p-5 hover:shadow-sm transition-shadow duration-150">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium mb-1">Latest Detection</p>
          <p className="text-sm font-semibold text-gray-900">
            {stats.latest_detection
              ? new Date(stats.latest_detection).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200/60 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Disease Distribution</h3>
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

        <div className="bg-white rounded-lg border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Status Distribution</h3>
            <div className="text-xs text-gray-500">Total: {stats.total_detections}</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={statusData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <defs>
                {statusData.map((item, index) => (
                  <linearGradient key={`statusGradient${index}`} id={`statusGradient${index}`} x1="0" y1="0" x2="0" y2="1">
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
                  <Cell key={`cell-${index}`} fill={`url(#statusGradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Status Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200/60">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">
                  {item.icon} {item.name}: <span className="font-medium">{item.value}</span> ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Detection Trends (Last 7 Days)</h3>
            <p className="text-xs text-gray-500 mt-1">
              {timeSeriesData.length > 0 && (
                <>
                  Total: {timeSeriesData.reduce((sum, d) => sum + d.detections, 0)} detections | 
                  Avg Confidence: {(
                    timeSeriesData.reduce((sum, d) => sum + d.confidence, 0) / timeSeriesData.length
                  ).toFixed(1)}%
                </>
              )}
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={timeSeriesData}
            margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#374151" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#374151" }}
              label={{ 
                value: "Detections", 
                angle: -90, 
                position: "insideLeft", 
                style: { textAnchor: "middle", fill: "#6b7280", fontSize: "12px" } 
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#374151" }}
              domain={[0, 100]}
              label={{ 
                value: "Confidence %", 
                angle: 90, 
                position: "insideRight", 
                style: { textAnchor: "middle", fill: "#6b7280", fontSize: "12px" } 
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
                  return null;
                }
                
                try {
                  const detectionsPayload = payload.find(p => p && p.dataKey === "detections");
                  const confidencePayload = payload.find(p => p && p.dataKey === "confidence");
                  
                  const detections = detectionsPayload?.value ?? 0;
                  const confidenceValue = confidencePayload?.value ?? 0;
                  const confidence = typeof confidenceValue === 'number' ? confidenceValue : parseFloat(confidenceValue) || 0;
                  const labelText = label || 'Unknown';
                  
                  return (
                    <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 text-gray-800 text-sm max-w-xs">
                      <p className="font-semibold mb-2">{labelText}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                          <span className="text-gray-600">
                            Detections: <span className="font-bold text-gray-900">{Number(detections) || 0}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                          <span className="text-gray-600">
                            Confidence: <span className="font-bold text-gray-900">{confidence.toFixed(1)}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error("Tooltip rendering error:", error);
                  return null;
                }
              }}
              animationDuration={200}
              cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "5 5" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => {
                if (value === "Detections") return "📊 Detections";
                if (value === "Avg Confidence %") return "📈 Avg Confidence";
                return value;
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="detections"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorDetections)"
              name="Detections"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="confidence"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorConfidence)"
              name="Avg Confidence %"
              animationBegin={200}
              animationDuration={1000}
              animationEasing="ease-out"
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {severityData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Severity Distribution</h3>
            <div className="text-xs text-gray-500">Total: {history.length}</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={severityData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                {severityData.map((item, index) => (
                  <linearGradient key={`severityGradient${index}`} id={`severityGradient${index}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={item.color} stopOpacity={1} />
                    <stop offset="100%" stopColor={item.color} stopOpacity={0.8} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal={true}
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                type="number"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#374151" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#6b7280"
                fontSize={13}
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fill: "#374151", fontWeight: 500 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 text-gray-800 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{data.icon}</span>
                          <p className="font-semibold">{data.name} Severity</p>
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
                radius={[0, 12, 12, 0]}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#severityGradient${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Severity Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200/60">
            {severityData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">
                  {item.icon} {item.name}: <span className="font-medium">{item.value}</span> ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
