import React, { useState, useEffect } from "react";
import { Zap, Code, Layers, Activity } from "lucide-react";

const CodebaseOverview = ({ repoName, fullUrl }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fullUrl) return;

    const fetchOverview = async () => {
      try {
        const response = await fetch("http://localhost:8000/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Overview fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [fullUrl]);

  if (loading)
    return (
      <div className="bg-[#1A1F3A] p-8 rounded-2xl border border-[#4A5578]/50 text-center animate-pulse">
        <Activity
          className="mx-auto text-[#3B82F6] mb-3 animate-spin"
          size={32}
        />
        <p className="text-[#94A3B8]">Analyzing {repoName} architecture...</p>
      </div>
    );

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Main Description Card - Spans 2 columns */}
      <div className="lg:col-span-2 bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50 hover:border-[#3B82F6]/50 transition-colors">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="text-yellow-400" size={20} /> Project Summary
        </h2>
        <p className="text-[#E2E8F0] leading-relaxed text-lg">
          {data.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {data.tech_stack?.map((tech, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-sm font-medium border border-[#3B82F6]/30"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Stats & Features Card */}
      <div className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50 hover:border-[#06B6D4]/50 transition-colors">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Layers className="text-[#06B6D4]" size={20} /> Key Features
        </h3>
        <ul className="space-y-3 mb-6">
          {data.key_features?.slice(0, 4).map((feature, i) => (
            <li key={i} className="flex items-start text-[#94A3B8] text-sm">
              <span className="mr-2 text-[#06B6D4] mt-1">•</span> {feature}
            </li>
          ))}
        </ul>

        <div className="pt-4 border-t border-[#4A5578]/30 flex justify-between items-center text-sm">
          <span className="text-gray-400">Complexity:</span>
          <span
            className={`px-2 py-0.5 rounded ${
              data.stats?.complexity === "High"
                ? "bg-red-500/20 text-red-400"
                : data.stats?.complexity === "Medium"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-green-500/20 text-green-400"
            }`}
          >
            {data.stats?.complexity || "Medium"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodebaseOverview;
