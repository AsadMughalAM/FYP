import React, { useState } from "react";
import LogOut from "../components/LogOut/LogOut";
import Dashboard from "../components/Dashboard/Dashboard";
import ImageDiagnosis from "../components/ImageDiagnosis/ImageDiagnosis";
import SymptomDiagnosis from "../components/SymptomDiagnosis/SymptomDiagnosis";
import VetChat from "../components/VetChat/VetChat";
import DiseaseResults from "../components/DiseaseResults/DiseaseResults";
import DetectionHistory from "../components/DetectionHistory/DetectionHistory";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Stethoscope, 
  FileText, 
  History, 
  MessageSquare, 
  Menu, 
  X,
  Bell,
  Search,
  BookOpen
} from "lucide-react";

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [latestDetection, setLatestDetection] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleDiagnosisSuccess = (detection) => {
    setLatestDetection(detection);
    setActiveTab("results");
    setRefreshTrigger((prev) => prev + 1);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "image", label: "Image Diagnosis", icon: <ImageIcon size={20} /> },
    { id: "symptoms", label: "Symptom Diagnosis", icon: <Stethoscope size={20} /> },
    { id: "results", label: "Diagnosis Results", icon: <FileText size={20} /> },
    { id: "history", label: "Medical History", icon: <History size={20} /> },
    { id: "chat", label: "Vet AI Chat", icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      {/* Premium Header */}
      <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm shadow-slate-900/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between h-18">
          <div className="flex items-center gap-4 lg:gap-8">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-all duration-300">
                <BookOpen className="text-white" size={22} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">VetAI <span className="text-blue-600">Diagnostics</span></h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Intelligent Health Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">  
            <div className="flex items-center gap-2">
              <LogOut />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-y-0 left-0 z-[80] w-72 bg-white border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto
          ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="sticky top-18 h-[calc(100vh-4.5rem)] flex flex-col p-4">
            <div className="flex items-center justify-between mb-8 px-2 lg:hidden">
              <h2 className="font-bold">Navigation</h2>
              <button onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
            </div>

            <nav className="space-y-1.5 flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                    ${activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <span className={`${activeTab === tab.id ? "text-white" : "text-slate-400"}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100/50 relative overflow-hidden group cursor-pointer">
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-600/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-widest mb-1 relative z-10">Premium Plan</h4>
              <p className="text-[11px] text-blue-700 font-medium relative z-10">Advanced AI diagnostics & Unlimited Chat</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0     animate-in fade-in duration-500">
          <div className={`
            bg-white border border-slate-200/60 shadow-xl shadow-slate-900/5  transition-all duration-500
            ${activeTab === "chat" ? "pt-6 lg:pt-8 px-0 pb-0 overflow-hidden" : "p-6 sm:p-8 lg:p-10"}
          `}>
            {activeTab === "dashboard" && <Dashboard />}
            
            {activeTab === "image" && (
              <ImageDiagnosis onUploadSuccess={handleDiagnosisSuccess} />
            )}
            
            {activeTab === "symptoms" && (
              <SymptomDiagnosis onDiagnosisSuccess={handleDiagnosisSuccess} />
            )}
            
            {activeTab === "results" && (
              <DiseaseResults detection={latestDetection} refreshTrigger={refreshTrigger} />
            )}

            {activeTab === "history" && (
              <DetectionHistory refreshTrigger={refreshTrigger} />
            )}

            {activeTab === "chat" && <VetChat />}
          </div>

          <footer className="bg-[#FFFFFF] text-center p-2  text-[11px] font-semibold text-slate-400 uppercase tracking-[0.2em] opacity-60">
            © 2026 VetAI Diagnostics · Advanced Neural Pathogen Detection
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Home;

