import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";

const SEVERITY_CONFIG = {
  CRITICAL: { color: "border-l-[#F43F5E]", badge: "bg-[#F43F5E]/20 text-[#F43F5E]", dot: "bg-[#F43F5E]" },
  HIGH: { color: "border-l-[#F59E0B]", badge: "bg-[#F59E0B]/20 text-[#F59E0B]", dot: "bg-[#F59E0B]" },
  MEDIUM: { color: "border-l-[#06B6D4]", badge: "bg-[#06B6D4]/20 text-[#06B6D4]", dot: "bg-[#06B6D4]" },
  LOW: { color: "border-l-[#10B981]", badge: "bg-[#10B981]/20 text-[#10B981]", dot: "bg-[#10B981]" },
};

const SecurityAnalysis = ({ fullUrl }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const fetchSecurity = async () => {
    if (!fullUrl) return;
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/analyze-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: fullUrl }),
      });
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (e) {
      console.error("Security scan failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, [fullUrl]);

  const filtered = filter === "ALL" ? issues : issues.filter((i) => i.severity === filter);
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  issues.forEach((i) => { if (counts[i.severity] !== undefined) counts[i.severity]++; });

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 hover:border-[#F43F5E]/30 transition-colors shadow-lg h-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F43F5E]/10 flex items-center justify-center">
            <ShieldAlert className="text-[#F43F5E]" size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Security Analysis</h2>
            <p className="text-xs text-[#94A3B8]">{loading ? "Scanning..." : `${issues.length} issue${issues.length !== 1 ? "s" : ""} found`}</p>
          </div>
        </div>
        <button onClick={fetchSecurity} disabled={loading} className="p-2 rounded-lg bg-[#1A1F3A] border border-[#4A5578]/50 text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Summary stats */}
      {!loading && issues.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4 shrink-0">
          {Object.entries(counts).map(([sev, count]) => (
            <button
              key={sev}
              onClick={() => setFilter(filter === sev ? "ALL" : sev)}
              className={clsx(
                "p-2 rounded-lg border text-center transition-all",
                filter === sev ? "border-current bg-current/10" : "border-[#4A5578]/30 bg-[#1A1F3A] hover:border-[#4A5578]",
                SEVERITY_CONFIG[sev]?.badge.split(" ")[1]
              )}
            >
              <p className="text-lg font-bold text-white">{count}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider">{sev}</p>
            </button>
          ))}
        </div>
      )}

      {/* Issues list */}
      <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1 min-h-[200px]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="animate-spin text-[#F43F5E]" size={28} />
            <p className="text-sm text-[#94A3B8]">Scanning for vulnerabilities...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-[#94A3B8] py-10">
            {issues.length === 0 ? (
              <>
                <ShieldAlert size={32} className="mx-auto text-[#10B981] mb-3" />
                <p className="font-medium text-white">No issues found!</p>
                <p className="text-xs mt-1">Your repository looks secure.</p>
              </>
            ) : (
              <p className="text-sm">No {filter} severity issues.</p>
            )}
          </div>
        )}

        {filtered.map((issue, idx) => {
          const cfg = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.LOW;
          return (
            <div
              key={idx}
              className={clsx("bg-[#1A1F3A] rounded-lg p-4 border-l-4 transition-all hover:bg-[#1A1F3A]/80", cfg.color)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={clsx("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest", cfg.badge)}>
                  {issue.severity}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">{issue.title}</h4>
              <div className="flex items-center gap-1.5 text-[#06B6D4] font-mono text-[10px] mb-2">
                <AlertTriangle size={10} />
                <span>{issue.location}</span>
              </div>
              <p className="text-[#94A3B8] text-xs leading-relaxed">{issue.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityAnalysis;
