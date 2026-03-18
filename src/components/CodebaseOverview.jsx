import React, { useState, useEffect } from "react";
import {
  Zap, Code, Layers, Activity, FileCode, Hash, Cpu, TrendingUp,
  Shield, Gauge, TestTube, GitBranch, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="bg-[#1A1F3A] p-5 rounded-2xl border border-[#4A5578]/50 hover:border-[#3B82F6]/40 transition-all group"
  >
    <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      <Icon size={20} className={`text-${color}`} />
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-xs text-[#94A3B8] mt-1 font-medium">{label}</p>
  </motion.div>
);

const QUICK_ACTIONS = [
  { id: "security", label: "Security Audit", icon: Shield, color: "[#F43F5E]", desc: "Scan for vulnerabilities" },
  { id: "quality", label: "Code Quality", icon: Gauge, color: "[#8B5CF6]", desc: "Maintainability score" },
  { id: "tests", label: "Generate Tests", icon: TestTube, color: "[#10B981]", desc: "AI unit test generation" },
  { id: "git", label: "Git Insights", icon: GitBranch, color: "[#06B6D4]", desc: "Commit analytics" },
];

const CodebaseOverview = ({ repoName, fullUrl, onTabChange }) => {
  const [fastData, setFastData] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [fastLoading, setFastLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    if (!fullUrl) return;

    // Phase 1: Fast stats (instant)
    const fetchFast = async () => {
      try {
        const res = await fetch("/overview-fast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });
        const result = await res.json();
        setFastData(result);
      } catch (err) {
        console.error("Fast overview failed:", err);
      } finally {
        setFastLoading(false);
      }
    };

    // Phase 2: AI summary (background)
    const fetchAI = async () => {
      try {
        const res = await fetch("/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });
        const result = await res.json();
        setAiData(result);
      } catch (err) {
        console.error("AI overview failed:", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchFast();
    fetchAI();
  }, [fullUrl]);

  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  };

  const langCount = fastData ? Object.keys(fastData.languages).length : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Stats Row */}
      {fastLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      ) : fastData ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={FileCode} label="Total Files" value={formatNumber(fastData.total_files)} color="[#3B82F6]" delay={0} />
          <StatCard icon={Hash} label="Lines of Code" value={formatNumber(fastData.total_lines)} color="[#06B6D4]" delay={0.05} />
          <StatCard icon={Code} label="Languages" value={langCount} color="[#8B5CF6]" delay={0.1} />
          <StatCard icon={Cpu} label="Complexity" value={fastData.complexity} color={
            fastData.complexity === "High" ? "[#F43F5E]" : fastData.complexity === "Medium" ? "[#F59E0B]" : "[#10B981]"
          } delay={0.15} />
        </div>
      ) : null}

      {/* Language Breakdown */}
      {fastData && Object.keys(fastData.languages).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-[#8B5CF6]" size={20} /> Language Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(fastData.languages).map(([lang, lines], i) => {
              const pct = ((lines / fastData.total_lines) * 100).toFixed(1);
              return (
                <div key={lang}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#E2E8F0] font-medium">{lang}</span>
                    <span className="text-[#94A3B8]">{formatNumber(lines)} lines ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#0A0E27] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Description Card */}
        <div className="lg:col-span-2 bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50 hover:border-[#3B82F6]/50 transition-colors">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} /> AI Summary
          </h2>
          {aiLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-4/5 rounded" />
              <div className="skeleton h-4 w-3/5 rounded" />
              <p className="text-xs text-[#94A3B8] mt-4 flex items-center gap-2">
                <Activity size={12} className="animate-spin" /> AI is analyzing the codebase...
              </p>
            </div>
          ) : aiData?.description ? (
            <>
              <p className="text-[#E2E8F0] leading-relaxed text-lg">{aiData.description}</p>
              {aiData.tech_stack?.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {aiData.tech_stack.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-sm font-medium border border-[#3B82F6]/30">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-[#94A3B8]">AI summary unavailable. Check if Ollama is running.</p>
          )}
        </div>

        {/* Key Features */}
        <div className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50 hover:border-[#06B6D4]/50 transition-colors">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Layers className="text-[#06B6D4]" size={20} /> Key Features
          </h3>
          {aiLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-4 rounded" />
              ))}
            </div>
          ) : aiData?.key_features?.length > 0 ? (
            <ul className="space-y-3">
              {aiData.key_features.slice(0, 5).map((feature, i) => (
                <li key={i} className="flex items-start text-[#94A3B8] text-sm">
                  <span className="mr-2 text-[#06B6D4] mt-0.5">•</span> {feature}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#94A3B8] text-sm">No features detected.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {onTabChange && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#4A5578] mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => onTabChange(action.id)}
                className="flex items-center gap-3 p-4 bg-[#1A1F3A] border border-[#4A5578]/50 rounded-xl hover:border-[#3B82F6]/50 hover:bg-[#2A3254] transition-all group text-left"
              >
                <div className={`w-9 h-9 rounded-lg bg-${action.color}/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <action.icon size={18} className={`text-${action.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{action.label}</p>
                  <p className="text-[10px] text-[#94A3B8] truncate">{action.desc}</p>
                </div>
                <ArrowRight size={14} className="text-[#4A5578] group-hover:text-[#3B82F6] ml-auto shrink-0 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CodebaseOverview;
