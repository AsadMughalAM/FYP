import React, { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ShieldAlert, 
  Stethoscope, 
  ShieldCheck, 
  Dna,
  History,
  Activity,
  FileSearch,
  ClipboardCheck,
  Zap
} from "lucide-react";

const DiseaseResults = ({ detection, refreshTrigger }) => {
  const [result, setResult] = useState(detection);

  useEffect(() => {
    if (detection) {
      setResult(detection);
    }
  }, [detection, refreshTrigger]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6">
          <FileSearch size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Awaiting Diagnosis</h3>
        <p className="text-slate-500 max-w-xs mx-auto">
          Upload an animal image or describe symptoms to generate a neural health report.
        </p>
      </div>
    );
  }

  const severityStyles = {
    None: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", icon: <CheckCircle2 size={18} /> },
    Low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: <Info size={18} /> },
    Medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: <AlertTriangle size={18} /> },
    High: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: <ShieldAlert size={18} /> },
    Critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", icon: <ShieldAlert size={18} /> }
  };

  const currentSeverity = severityStyles[result.severity] || severityStyles.Medium;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Report #{result.id || "TMP-1"}</span>
            <span className="text-slate-400 text-xs font-medium">{new Date(result.created_at).toLocaleString()}</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{result.disease_name || "Unknown Condition"}</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <Dna size={14} className="text-blue-500" />
            Subject: <span className="text-slate-700">{result.animal_name || "Unknown Species"}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200/60">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{(result.confidence_score * 100).toFixed(1)}%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Activity size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Analysis Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Severity Alert */}
          <div className={`flex items-center gap-4 p-5 rounded-3xl border-2 ${currentSeverity.bg} ${currentSeverity.border} ${currentSeverity.text}`}>
            <div className="shrink-0 p-2 bg-white rounded-xl shadow-sm">
              {currentSeverity.icon}
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">Severity Level: {result.severity || "Standard"}</h4>
              <p className="text-xs opacity-90 font-medium mt-0.5">Automated assessment based on identified biomarkers and historical data.</p>
            </div>
          </div>

          {/* Contagious Warning */}
          {result.contagious && (
            <div className="bg-red-900 text-white p-6 rounded-[2rem] shadow-xl shadow-red-900/10 flex gap-4 animate-pulse">
              <ShieldAlert size={28} className="shrink-0" />
              <div>
                <h4 className="text-lg font-bold mb-1">Containment Required</h4>
                <p className="text-sm text-red-100/90 leading-relaxed">
                  This condition is highly contagious. Immediate isolation of the subject and sterilization of the environment is recommended.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Intelligence Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Stethoscope size={20} />
                </div>
                <h5 className="font-bold text-slate-900">Symptoms</h5>
              </div>
              <ul className="space-y-2.5">
                {result.symptoms?.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mt-1.5"></span>
                    {item}
                  </li>
                )) || <li className="text-xs text-slate-400 italic">No symptoms recorded</li>}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <h5 className="font-bold text-slate-900">Prevention</h5>
              </div>
              <ul className="space-y-2.5">
                {result.prevention?.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1.5"></span>
                    {item}
                  </li>
                )) || <li className="text-xs text-slate-400 italic">No prevention data</li>}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl shadow-slate-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Zap size={20} className="text-blue-400" />
                </div>
                <h5 className="text-lg font-bold">Treatment Protocol</h5>
              </div>
              <div className="space-y-4">
                {result.treatment?.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <span className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                  </div>
                )) || <p className="text-sm text-slate-500">Contact a specialist for treatment details.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Data Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visual Evidence */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Medical Evidence</h5>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded-full">RAW DATA</span>
            </div>
            <div className="p-4">
              {result.image ? (
                <img src={result.image} alt="Diagnosis" className="w-full h-48 object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 italic text-sm">No image available</div>
              )}
            </div>
          </div>

          {/* Prediction Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Neural Probability</h5>
            <div className="space-y-4">
              {result.all_predictions && Object.entries(result.all_predictions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([name, conf], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 truncate mr-2">{name}</span>
                      <span className="text-blue-600">{(conf * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${conf * 100}%` }}></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Antibiotic Insights */}
          {result.antibiotics?.length > 0 && (
            <div className="bg-blue-600 text-white rounded-3xl p-6 shadow-lg shadow-blue-600/20">
              <h5 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <ClipboardCheck size={14} />
                Recommended Agents
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.antibiotics.map((name, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-bold uppercase">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Report Footer/Legal */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex gap-3">
            <Info size={16} className="text-slate-400 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              This report is generated by a neural network and should be verified by a licensed veterinarian before clinical intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseResults;

