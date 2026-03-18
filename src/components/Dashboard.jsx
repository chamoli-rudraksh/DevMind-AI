import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileCode,
  Shield,
  FileText,
  MessageSquare,
  Gauge,
  TestTube,
  GitBranch,
} from "lucide-react";
import { clsx } from "clsx";
import CodebaseOverview from "./CodebaseOverview";
import ProjectStructure from "./ProjectStructure";
import SecurityAnalysis from "./SecurityAnalysis";
import DocGenerator from "./DocGenerator";
import ChatInterface from "./ChatInterface";
import CodeQuality from "./CodeQuality";
import TestGenerator from "./TestGenerator";
import GitInsights from "./GitInsights";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = ({ repoName, fullUrl, onReset }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [visitedTabs, setVisitedTabs] = useState({ overview: true });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => ({ ...prev, [tabId]: true }));
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, color: "text-[#3B82F6]" },
    { id: "structure", label: "Structure", icon: FileCode, color: "text-[#F59E0B]" },
    { id: "security", label: "Security", icon: Shield, color: "text-[#F43F5E]" },
    { id: "quality", label: "Quality", icon: Gauge, color: "text-[#8B5CF6]" },
    { id: "tests", label: "Tests", icon: TestTube, color: "text-[#10B981]" },
    { id: "git", label: "Git Insights", icon: GitBranch, color: "text-[#06B6D4]" },
    { id: "docs", label: "Docs", icon: FileText, color: "text-[#EC4899]" },
    { id: "chat", label: "Chat", icon: MessageSquare, color: "text-[#3B82F6]" },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen pt-20 pb-12 px-4 lg:px-8 gap-6 max-w-[1600px] mx-auto">
      {/* Sidebar Nav - Desktop */}
      <div className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 space-y-1">
          <div className="px-3 py-2 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#4A5578]">Navigation</p>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group",
                activeTab === tab.id
                  ? "bg-[#2A3254] text-white shadow-lg border border-[#4A5578]/50"
                  : "text-[#94A3B8] hover:bg-[#1A1F3A] hover:text-white"
              )}
            >
              <tab.icon
                size={16}
                className={clsx(
                  "transition-colors",
                  activeTab === tab.id ? tab.color : "group-hover:text-white"
                )}
              />
              {tab.label}
              {activeTab === tab.id && (
                <div className={clsx("ml-auto w-1.5 h-1.5 rounded-full", tab.color.replace("text-", "bg-"))} />
              )}
            </button>
          ))}

          <div className="pt-4 px-3">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-[#4A5578]/50 text-[#94A3B8] hover:text-white hover:border-[#3B82F6]/50 transition-all text-xs font-medium"
            >
              ← Analyze New Repo
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="lg:hidden flex overflow-x-auto gap-2 pb-3 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-xs border transition-all",
              activeTab === tab.id
                ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]"
                : "bg-[#1A1F3A] border-[#2A3254] text-[#94A3B8]"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: activeTab === tab.id ? "block" : "none" }}
            className="space-y-6 h-full"
          >
            {visitedTabs[tab.id] && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                {tab.id === "overview" && (
                  <CodebaseOverview repoName={repoName} fullUrl={fullUrl} onTabChange={handleTabChange} />
                )}
                {tab.id === "structure" && <ProjectStructure fullUrl={fullUrl} />}
                {tab.id === "security" && <SecurityAnalysis fullUrl={fullUrl} />}
                {tab.id === "quality" && <CodeQuality fullUrl={fullUrl} />}
                {tab.id === "tests" && <TestGenerator fullUrl={fullUrl} repoName={repoName} />}
                {tab.id === "git" && <GitInsights fullUrl={fullUrl} />}
                {tab.id === "docs" && <DocGenerator repoUrl={fullUrl} />}
                {tab.id === "chat" && <ChatInterface repoName={repoName} fullUrl={fullUrl} />}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
