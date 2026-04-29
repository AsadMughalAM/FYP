import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Stethoscope, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Info, 
  Zap,
  Activity,
  ShieldCheck,
  Dna,
  ArrowRight,
  ClipboardList
} from "lucide-react";
import API_BASE_URL, { getAuthHeaders } from "../../config/api";

const SymptomDiagnosis = ({ onDiagnosisSuccess }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [diagnosisResults, setDiagnosisResults] = useState(null);
  const [symptomSearch, setSymptomSearch] = useState("");

  const { data: symptomsData, isLoading: symptomsLoading } = useQuery({
    queryKey: ['symptoms'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/symptoms/`, { headers: getAuthHeaders() });
      return response.data;
    },
    retry: 1
  });

  const availableSymptoms = symptomsData?.symptoms || [];
  const filteredSymptoms = availableSymptoms.filter(s => 
    s.toLowerCase().includes(symptomSearch.toLowerCase())
  );

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) => 
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const mutation = useMutation({
    mutationFn: async (formData) => {
      const requestPayload = {
        symptoms: selectedSymptoms,
        animal_name: formData?.animal_name || '',
        animal_age: formData?.animal_age || null,
        notes: formData?.notes || '',
      };
      const response = await axios.post(`${API_BASE_URL}/diagnose/`, requestPayload, { headers: getAuthHeaders() });
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data && data.results && data.results.length > 0) {
        let transformedDetection;
        if (data.saved_diagnosis) {
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
          };
        }
        setDiagnosisResults(data);
        if (onDiagnosisSuccess && transformedDetection) {
          onDiagnosisSuccess(transformedDetection);
        }
      }
    }
  });

  const onSubmit = (formData) => {
    if (selectedSymptoms.length === 0) return;
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-600">
            <Stethoscope size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic Intake</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Symptom Analysis</h2>
          <p className="text-slate-500 font-medium mt-1">Cross-referencing behavioral and physical markers against our pathogen database.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Subject Profiling */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Dna size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Subject Profiling</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Animal Identifier</label>
              <input
                type="text"
                {...register("animal_name")}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
                placeholder="e.g., Alpha-01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biological Age (Months)</label>
              <input
                type="number"
                {...register("animal_age")}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                placeholder="Age in months"
              />
            </div>
          </div>
        </div>

        {/* Marker Selection */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Activity size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Clinical Markers</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filter symptoms..."
                value={symptomSearch}
                onChange={(e) => setSymptomSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all w-full md:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSymptoms.map((symptom) => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`group px-4 py-3 rounded-2xl text-xs font-bold transition-all border text-left flex items-center justify-between ${
                    isSelected 
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50/50"
                  }`}
                >
                  <span className="truncate">{symptom}</span>
                  {isSelected && <CheckCircle2 size={12} />}
                </button>
              );
            })}
          </div>

          {selectedSymptoms.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Observations ({selectedSymptoms.length})</p>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 border border-blue-100">
                    {s}
                    <button type="button" onClick={() => toggleSymptom(s)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clinical Observations */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ClipboardList size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clinical Observations</h3>
          </div>
          <textarea
            {...register("notes")}
            rows={4}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none placeholder:text-slate-300"
            placeholder="Document additional behavioral anomalies, duration, and environmental factors..."
          />
        </div>

        {/* Action Bar */}
        <button
          type="submit"
          disabled={mutation.isPending || selectedSymptoms.length === 0}
          className={`w-full group relative overflow-hidden py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${
            mutation.isPending || selectedSymptoms.length === 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 shadow-2xl shadow-slate-900/20 active:scale-[0.98]"
          }`}
        >
          {mutation.isPending ? (
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="animate-spin" />
              SYNCHRONIZING NEURAL MATRIX...
            </div>
          ) : (
            <>
              INITIATE DIAGNOSTIC SEQUENCE
              <Zap size={18} className="group-hover:scale-125 transition-transform text-blue-400" />
            </>
          )}
        </button>
      </form>

      {/* Results Rendering */}
      {diagnosisResults && (
        <div className="mt-16 space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Diagnostic Output</h3>
            <button 
              onClick={() => setDiagnosisResults(null)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Discard Protocol
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {diagnosisResults.results?.map((res, i) => (
              <div key={i} className="bg-white rounded-[3rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 group">
                {/* Result Header */}
                <div className={`p-8 border-b border-slate-100 relative overflow-hidden`}>
                  <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full translate-x-32 -translate-y-32 ${res.severity === 'Critical' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${res.severity === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {res.severity} Risk
                        </span>
                        {res.contagious && (
                          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100">
                            Biohazard / Contagious
                          </span>
                        )}
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{res.disease_name}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confidence Matrix: {(res.confidence * 100).toFixed(1)}%</p>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="text-5xl font-black text-slate-900">{(res.confidence * 100).toFixed(0)}<span className="text-2xl text-blue-600">%</span></div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${res.confidence * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result Content */}
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Info size={12} className="text-blue-500" />
                      Treatment Protocol
                    </h5>
                    <ul className="space-y-3">
                      {res.treatment?.map((t, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-700 flex gap-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">{idx + 1}</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap size={12} className="text-purple-500" />
                      Medication / Antibiotics
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {res.medicines?.map((m, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-purple-100">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      Prevention Strategy
                    </h5>
                    <ul className="space-y-3">
                      {res.prevention?.map((p, idx) => (
                        <li key={idx} className="text-xs font-bold text-slate-700 flex gap-3 italic">
                          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-600 transition-colors">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-100">AI-Generated Diagnostic Assessment</span>
                  <button className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest group-hover:text-white">
                    Access Detailed Lab Report
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomDiagnosis;

