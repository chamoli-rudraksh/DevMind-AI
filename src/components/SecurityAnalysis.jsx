import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

const SecurityAnalysis = ({ fullUrl }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fullUrl) return;

    const fetchSecurity = async () => {
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

    fetchSecurity();
  }, [fullUrl]);

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-8 hover:border-[#3B82F6]/50 transition-colors shadow-lg h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#4A5578]/30 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-[#F43F5E]" size={24} />
          <h2 className="text-xl font-semibold text-white">
            Security Analysis
          </h2>
        </div>
        {loading ? (
          <span className="text-[#3B82F6] text-sm animate-pulse">
            Scanning...
          </span>
        ) : (
          <span className="text-[#94A3B8] text-sm">
            Issues: {issues.length}
          </span>
        )}
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-[300px]">
        {loading && (
          <div className="flex flex-col items-center justify-center h-40 text-[#94A3B8] gap-3">
            <Loader2 className="animate-spin text-[#3B82F6]" size={32} />
            <p>Analyzing codebase for vulnerabilities...</p>
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="text-center text-[#94A3B8] py-10">
            No security issues found. Great job!
          </div>
        )}

        {issues.map((issue, idx) => (
          <div
            key={idx}
            className={clsx(
              "bg-[#1A1F3A] rounded-lg p-5 border-l-4 transition-transform hover:-translate-x-1",
              issue.severity === "CRITICAL"
                ? "border-l-[#F43F5E]"
                : issue.severity === "HIGH"
                  ? "border-l-[#F59E0B]"
                  : issue.severity === "MEDIUM"
                    ? "border-l-[#06B6D4]"
                    : "border-l-[#10B981]",
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                  issue.severity === "CRITICAL"
                    ? "bg-[#F43F5E]/20 text-[#F43F5E]"
                    : issue.severity === "HIGH"
                      ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                      : issue.severity === "MEDIUM"
                        ? "bg-[#06B6D4]/20 text-[#06B6D4]"
                        : "bg-[#10B981]/20 text-[#10B981]",
                )}
              >
                {issue.severity}
              </span>
            </div>

            <h4 className="text-lg font-semibold text-white mb-2">
              {issue.title}
            </h4>

            <div className="flex items-center gap-2 text-[#06B6D4] font-mono text-xs mb-3">
              <AlertTriangle size={12} />
              <span>{issue.location}</span>
            </div>

            <p className="text-[#94A3B8] text-sm mb-4 leading-relaxed">
              {issue.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityAnalysis;
