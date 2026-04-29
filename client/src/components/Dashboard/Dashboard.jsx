import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  History as HistoryIcon, 
  RefreshCw,
  LayoutDashboard,
  Dna,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap
} from "lucide-react";
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
      console.error("Dashboard error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/signin";
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Matrix...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_detections === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-900/5 animate-bounce-subtle">
          <LayoutDashboard size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">System Initialization Awaited</h3>
        <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
          The analytics engine is ready. Initiate your first animal health scan to populate the intelligence dashboard.
        </p>
        <button
          onClick={fetchDashboardData}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
        >
          Re-initialize Sync
        </button>
      </div>
    );
  }

  // Process data for charts
  const excludedDiseases = ['blackleg', 'mastitis', 'bloat', 'foot rot', 'footrot', 'foot_rot', 'foot-rot'];
  const diseaseData = Object.entries(stats.disease_distribution || {})
    .filter(([name]) => !excludedDiseases.some(ex => name.toLowerCase().includes(ex)))
    .map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + "..." : name,
      fullName: name,
      value 
    }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  const timeSeriesData = history
    .slice()
    .reverse()
    .slice(-10)
    .map(item => ({
      date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      confidence: parseFloat((item.confidence_score * 100).toFixed(1)),
      val: 1
    }))
    .reduce((acc, curr) => {
      const existing = acc.find(x => x.date === curr.date);
      if (existing) {
        existing.val += 1;
        existing.confidence = (existing.confidence + curr.confidence) / 2;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

  return (
    <div className="space-y-10 pb-10">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Activity size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Real-time Surveillance</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Hub</h2>
          <p className="text-slate-500 font-medium mt-1">Cross-species health analytics and neural diagnostics oversight.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group active:scale-95"
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
          FORCE SYNC
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Aggregate Detections", val: stats.total_detections, icon: <Search size={20} />, color: "blue" },
          { label: "Avg Neural Confidence", val: `${(stats.average_confidence * 100).toFixed(1)}%`, icon: <TrendingUp size={20} />, color: "emerald" },
          { label: "Active Strains", val: Object.keys(stats.disease_distribution || {}).length, icon: <Dna size={20} />, color: "purple" },
          { label: "Critical Incidents", val: history.filter(h => h.severity === 'Critical').length, icon: <ShieldAlert size={20} />, color: "red" },
        ].map((kpi, i) => (
          <div key={i} className="group bg-white p-6 rounded-[2rem] border border-slate-200/60 hover:border-blue-400 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${kpi.color}-500/5 blur-[40px] rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center mb-6`}>
                {kpi.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h4 className="text-3xl font-black text-slate-900">{kpi.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Health Trajectory</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Timeline analysis of neural detection events.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500">SCANS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500">CONFIDENCE</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fill="url(#trendGradient)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/10">
          <h3 className="text-xl font-bold mb-2">Pathogen Profile</h3>
          <p className="text-xs text-slate-400 font-medium mb-10">Strain distribution across active scans.</p>
          
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {diseaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black">{stats.total_detections}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Scans</span>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {diseaseData.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{item.fullName}</span>
                </div>
                <span className="text-xs font-black text-slate-500 group-hover:text-blue-400 transition-colors">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Severity Metrics */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Severity Stratification</h3>
              <p className="text-xs text-slate-400 font-medium">Risk assessment breakdown for active subjects.</p>
            </div>
          </div>

          <div className="space-y-6">
            {['Critical', 'High', 'Medium', 'Low', 'None'].map((sev, i) => {
              const count = history.filter(h => h.severity === sev).length;
              const percent = stats.total_detections > 0 ? (count / stats.total_detections) * 100 : 0;
              const colorClass = sev === 'Critical' ? 'bg-red-600' : sev === 'High' ? 'bg-orange-500' : sev === 'Medium' ? 'bg-amber-400' : sev === 'Low' ? 'bg-blue-500' : 'bg-emerald-500';
              
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <span>{sev} RISK</span>
                    <span>{count} EVENTS ({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colorClass} rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <HistoryIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Surveillance Stream</h3>
              <p className="text-xs text-slate-400 font-medium">Live update feed of detection interactions.</p>
            </div>
          </div>

          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {history.slice(0, 5).map((item, i) => (
              <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-blue-200 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  {item.disease_name === 'Healthy' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertTriangle className="text-amber-500" size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-slate-900">{item.disease_name} identified in {item.animal_name}</h5>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Confidence Matrix: {(item.confidence_score * 100).toFixed(1)}% | Case Status: {item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

