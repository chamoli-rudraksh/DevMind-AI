import React, { useState, useEffect } from "react";
import { Activity, Code, Layers, Zap } from "lucide-react";

const Overview = ({ repoName, fullUrl }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch("http://localhost:8000/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });

        if (!response.ok) throw new Error("Failed to fetch overview");

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [fullUrl]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8] animate-pulse">
        <Activity className="mr-2 animate-spin" /> Analyzing architecture...
      </div>
    );

  if (error) return <div className="text-red-400 p-4">Error: {error}</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Description Card */}
      <div className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <Zap className="text-yellow-400" size={20} /> Project Summary
        </h2>
        <p className="text-[#E2E8F0] leading-relaxed">{data.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tech Stack */}
        <div className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Code className="text-[#3B82F6]" size={20} /> Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.tech_stack.map((tech, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-[#3B82F6]/20 text-[#3B82F6] rounded-full text-sm border border-[#3B82F6]/30"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-[#1A1F3A] p-6 rounded-2xl border border-[#4A5578]/50">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Layers className="text-[#06B6D4]" size={20} /> Key Features
          </h3>
          <ul className="space-y-2">
            {data.key_features.map((feature, i) => (
              <li key={i} className="flex items-start text-[#94A3B8] text-sm">
                <span className="mr-2 text-[#06B6D4]">•</span> {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Overview;
