import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileCode,
  Shield,
  FileText,
  MessageSquare,
} from "lucide-react";
import { clsx } from "clsx";
import CodebaseOverview from "./CodebaseOverview";
import ProjectStructure from "./ProjectStructure";
import SecurityAnalysis from "./SecurityAnalysis";
import DocGenerator from "./DocGenerator";
import ChatInterface from "./ChatInterface";
import { motion } from "framer-motion";

const Dashboard = ({ repoName, fullUrl }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "structure", label: "Structure", icon: FileCode },
    { id: "security", label: "Security", icon: Shield },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  // Auto scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen pt-20 pb-12 px-6 lg:px-12 gap-8 max-w-[1600px] mx-auto">
      {/* Sidebar Nav - Desktop */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                activeTab === tab.id
                  ? "bg-[#2A3254] text-white border-l-4 border-[#3B82F6] shadow-lg"
                  : "text-[#94A3B8] hover:bg-[#1A1F3A] hover:text-white",
              )}
            >
              <tab.icon
                size={18}
                className={activeTab === tab.id ? "text-[#3B82F6]" : ""}
              />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm border transition-all",
              activeTab === tab.id
                ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]"
                : "bg-[#1A1F3A] border-[#2A3254] text-[#94A3B8]",
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 space-y-8"
      >
        {activeTab === "overview" && (
          <>
            {}
            <CodebaseOverview repoName={repoName} fullUrl={fullUrl} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {}
              <ProjectStructure fullUrl={fullUrl} />
              <SecurityAnalysis fullUrl={fullUrl} />
            </div>
          </>
        )}

        {activeTab === "structure" && <ProjectStructure />}

        {activeTab === "security" && <SecurityAnalysis />}

        {activeTab === "docs" && <DocGenerator repoUrl={fullUrl} />}

        {activeTab === "chat" && (
          <ChatInterface repoName={repoName} fullUrl={fullUrl} />
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
