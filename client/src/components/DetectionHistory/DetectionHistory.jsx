import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Search, 
  History, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Activity,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const DetectionHistory = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  useEffect(() => {
    const filtered = history.filter(item => 
      item.disease_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.animal_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHistory(filtered);
  }, [searchQuery, history]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
      const response = await axios.get(`${API_BASE_URL}/animal/history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const excludedDiseases = ['blackleg', 'mastitis', 'bloat', 'foot rot', 'footrot', 'foot_rot', 'foot-rot'];
      const rawData = response.data.data || [];
      const filtered = rawData.filter((detection) => {
        if (!detection.disease_name) return true;
        const lowerName = detection.disease_name.toLowerCase();
        return !excludedDiseases.some(excluded => lowerName.includes(excluded));
      });
      
      setHistory(filtered);
      setFilteredHistory(filtered);
    } catch (error) {
      console.error("History fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyles = (severity) => {
    const styles = {
      None: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Low: "bg-blue-50 text-blue-700 border-blue-100",
      Medium: "bg-amber-50 text-amber-700 border-amber-100",
      High: "bg-orange-50 text-orange-700 border-orange-100",
      Critical: "bg-red-50 text-red-700 border-red-100"
    };
    return styles[severity] || "bg-slate-50 text-slate-700 border-slate-100";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Medical Archives...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6">
          <History size={40} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No Records Found</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Your medical detection history is currently empty. Complete a scan to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search records by species or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCw size={14} />
          REFRESH
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject & Strain</th>
                <th className="px-6 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Confidence</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className={`group hover:bg-slate-50/50 transition-colors cursor-pointer ${selectedId === item.id ? 'bg-blue-50/30' : ''}`} onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-white group-hover:text-blue-600 transition-colors">
                          <Calendar size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 tracking-tight">{item.disease_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.animal_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.confidence_score * 100}%` }}></div>
                        </div>
                        <span className="text-xs font-black text-slate-900">{(item.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getSeverityStyles(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {selectedId === item.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Detail View */}
                  {selectedId === item.id && (
                    <tr>
                      <td colSpan="5" className="px-8 py-8 bg-slate-50/50 border-t border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-top-4 duration-500">
                          {/* Image Preview */}
                          <div className="md:col-span-4">
                            <div className="relative group overflow-hidden rounded-[2rem] border-4 border-white shadow-xl">
                              {item.image ? (
                                <img src={item.image} alt="Diagnosis Evidence" className="w-full aspect-square object-cover" />
                              ) : (
                                <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                                  <FileText size={48} />
                                  <span className="text-xs mt-2 font-bold uppercase tracking-widest">No Visual Evidence</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <ExternalLink className="text-white" size={24} />
                              </div>
                            </div>
                          </div>

                          {/* Data Insights */}
                          <div className="md:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Summary</h4>
                              <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${item.status === 'recovered' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                <Activity size={14} />
                                {item.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <AlertCircle size={12} className="text-amber-500" />
                                  Observed Symptoms
                                </h5>
                                <ul className="space-y-1.5">
                                  {item.symptoms?.slice(0, 4).map((s, idx) => (
                                    <li key={idx} className="text-xs font-bold text-slate-700 flex gap-2">
                                      <span className="text-blue-500">•</span> {s}
                                    </li>
                                  )) || <li className="text-xs text-slate-400 italic">No symptoms recorded</li>}
                                </ul>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  Treatment Status
                                </h5>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                  {item.treatment?.[0] || "No treatment protocol initiated for this case record."}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                                <Download size={14} />
                                Download PDF Report
                              </button>
                              <button className="px-4 py-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination/Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {filteredHistory.length} of {history.length} cases</span>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30" disabled><ChevronRight size={18} className="rotate-180" /></button>
            <button className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-30" disabled><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionHistory;

