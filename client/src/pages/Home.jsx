import React, { useState } from "react";
import LogOut from "../components/LogOut/LogOut";
import Dashboard from "../components/Dashboard/Dashboard";
import ImageDiagnosis from "../components/ImageDiagnosis/ImageDiagnosis";
import SymptomDiagnosis from "../components/SymptomDiagnosis/SymptomDiagnosis";
import VetChat from "../components/VetChat/VetChat";
import DiseaseResults from "../components/DiseaseResults/DiseaseResults";
import DetectionHistory from "../components/DetectionHistory/DetectionHistory";

const Home = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [latestDetection, setLatestDetection] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDiagnosisSuccess = (detection) => {
    setLatestDetection(detection);
    setActiveTab("results");
    setRefreshTrigger((prev) => prev + 1);
  };

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "image",
      label: "Image Diagnosis",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "symptoms",
      label: "Symptom Diagnosis",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "results",
      label: "Results",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "history",
      label: "History",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "chat",
      label: "Vet Chat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">VetAI Diagnostics</h1>
                <p className="text-xs text-gray-500 leading-tight">Animal Health Management</p>
              </div>
            </div>
            <LogOut />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg border border-gray-200/60 p-1.5 sticky top-20 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200/60 shadow-sm p-6 lg:p-8">
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
          </main>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200/60 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 VetAI Diagnostics. AI-Powered Animal Health Detection System</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
