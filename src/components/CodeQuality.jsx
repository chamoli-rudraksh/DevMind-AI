import React, { useState, useEffect } from "react";
import { Gauge, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Award } from "lucide-react";
import { clsx } from "clsx";

const ScoreMeter = ({ score, label, notes, color }) => {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 80) return "from-emerald-500 to-green-400";
    if (score >= 60) return "from-yellow-500 to-amber-400";
    if (score >= 40) return "from-orange-500 to-orange-400";
    return "from-red-500 to-rose-400";
  };

  return (
    <div className="bg-[#1A1F3A] rounded-xl p-4 border border-[#4A5578]/30 hover:border-[#4A5578]/60 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{notes}</p>
        </div>
        <span className={clsx("text-xl font-bold", score >= 80 ? "text-emerald-400" : score >= 60 ? "text-yellow-400" : score >= 40 ? "text-orange-400" : "text-red-400")}>
          {score}
        </span>
      </div>
      <div className="h-1.5 bg-[#0A0E27] rounded-full overflow-hidden">
        <div
          className={clsx("h-full rounded-full bg-gradient-to-r transition-all duration-1000", getColor())}
          style={{ width: `${animated}%` }}
        />
      </div>
    </div>
  );
};

const getGradeColor = (grade) => {
  const colors = { A: "text-emerald-400", B: "text-green-400", C: "text-yellow-400", D: "text-orange-400", F: "text-red-400" };
  return colors[grade] || "text-[#94A3B8]";
};

const CodeQuality = ({ fullUrl }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuality = async () => {
    if (!fullUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/analyze-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: fullUrl }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuality();
  }, [fullUrl]);

  const metricLabels = {
    maintainability: "Maintainability",
    complexity: "Code Complexity",
    test_coverage_estimate: "Test Coverage",
    documentation: "Documentation",
    code_duplication: "Code Duplication",
    security_posture: "Security Posture",
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
              <Gauge className="text-[#8B5CF6]" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Code Quality Analysis</h2>
              <p className="text-sm text-[#94A3B8]">AI-powered maintainability & health assessment</p>
            </div>
          </div>
          <button
            onClick={fetchQuality}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1A1F3A] border border-[#4A5578]/50 text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] animate-spin" />
              <Gauge className="absolute inset-0 m-auto text-[#8B5CF6]" size={24} />
            </div>
            <p className="text-[#94A3B8] text-sm">Analyzing code quality with AI...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center gap-6 p-5 bg-[#1A1F3A] rounded-xl border border-[#4A5578]/30">
              <div className="text-center">
                <div className={clsx("text-6xl font-black", getGradeColor(data.grade))}>
                  {data.grade}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">Grade</p>
              </div>
              <div className="flex-1">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">{data.overall_score}</span>
                  <span className="text-[#94A3B8] text-sm pb-1">/100</span>
                  <Award className="text-[#F59E0B] ml-auto" size={20} />
                </div>
                <div className="h-3 bg-[#0A0E27] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] transition-all duration-1000"
                    style={{ width: `${data.overall_score}%` }}
                  />
                </div>
                <p className="text-sm text-[#94A3B8]">{data.summary}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.metrics && Object.entries(data.metrics).map(([key, metric]) => (
                <ScoreMeter
                  key={key}
                  score={metric.score}
                  label={metricLabels[key] || key}
                  notes={metric.notes}
                />
              ))}
            </div>

            {/* Issues & Strengths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A1F3A] rounded-xl p-4 border border-red-500/20">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-400" />
                  Top Issues
                </h3>
                <ul className="space-y-2">
                  {(data.top_issues || []).map((issue, i) => (
                    <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#1A1F3A] rounded-xl p-4 border border-emerald-500/20">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {(data.top_strengths || []).map((s, i) => (
                    <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <div className="bg-[#1A1F3A] rounded-xl p-4 border border-[#3B82F6]/20">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[#3B82F6]" />
                  Recommendations
                </h3>
                <ol className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-[#94A3B8] flex items-start gap-2">
                      <span className="text-[#3B82F6] font-bold shrink-0">{i + 1}.</span>
                      {rec}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeQuality;
