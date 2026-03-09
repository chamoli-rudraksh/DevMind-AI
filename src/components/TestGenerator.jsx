import React, { useState } from "react";
import {
  TestTube,
  Loader2,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const FRAMEWORKS = [
  { value: "auto", label: "Auto-detect" },
  { value: "jest", label: "Jest (JavaScript)" },
  { value: "pytest", label: "pytest (Python)" },
  { value: "junit", label: "JUnit (Java)" },
  { value: "vitest", label: "Vitest (TypeScript)" },
  { value: "rspec", label: "RSpec (Ruby)" },
  { value: "go_test", label: "go test (Go)" },
];

const TestGenerator = ({ fullUrl, repoName }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState("auto");
  const [expandedFile, setExpandedFile] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (code, filename) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    if (!fullUrl) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("http://localhost:8000/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: fullUrl, framework }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
      if (result.files?.length > 0) setExpandedFile(0);
    } catch (e) {
      setError(e.message || "Test generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
            <TestTube className="text-[#10B981]" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Test Generator</h2>
            <p className="text-sm text-[#94A3B8]">Generate comprehensive unit tests for your codebase</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Test Framework</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className="w-full bg-[#1A1F3A] border border-[#4A5578] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#10B981]"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !fullUrl}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#10B981] to-[#06B6D4] text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><TestTube size={16} /> Generate Tests</>
              )}
            </button>
          </div>
        </div>

        {!fullUrl && (
          <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 text-sm">
            Please analyze a repository first.
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={36} className="animate-spin text-[#10B981]" />
            <p className="text-[#94A3B8] text-sm">Generating tests with AI... this may take a moment</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {/* Meta info */}
            <div className="flex flex-wrap gap-3 p-4 bg-[#1A1F3A] rounded-xl border border-[#4A5578]/30">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Framework:</span>
                <span className="px-2 py-0.5 bg-[#10B981]/20 text-[#10B981] text-xs rounded-full font-medium">{data.framework}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Language:</span>
                <span className="px-2 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] text-xs rounded-full font-medium">{data.language}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Files:</span>
                <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded-full font-medium">{data.files?.length || 0}</span>
              </div>
            </div>

            {/* Setup instructions */}
            {data.setup_instructions && (
              <div className="p-4 bg-[#1A1F3A] rounded-xl border border-[#3B82F6]/20">
                <p className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wider mb-1">Setup Instructions</p>
                <p className="text-sm text-[#94A3B8]">{data.setup_instructions}</p>
              </div>
            )}

            {/* Test files */}
            <div className="space-y-3">
              {(data.files || []).map((file, i) => (
                <div key={i} className="bg-[#1A1F3A] rounded-xl border border-[#4A5578]/30 overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#4A5578]/10 transition-colors"
                    onClick={() => setExpandedFile(expandedFile === i ? null : i)}
                  >
                    <FileCode size={16} className="text-[#10B981] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-white truncate">{file.filename}</p>
                      <p className="text-xs text-[#94A3B8] truncate">{file.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(file.code, `copy-${i}`); }}
                        className="p-1.5 rounded-lg hover:bg-[#4A5578]/30 text-[#94A3B8] hover:text-white transition-colors"
                      >
                        {copiedId === `copy-${i}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(file.code, file.filename); }}
                        className="p-1.5 rounded-lg hover:bg-[#4A5578]/30 text-[#94A3B8] hover:text-white transition-colors"
                      >
                        <Download size={14} />
                      </button>
                      {expandedFile === i ? <ChevronUp size={16} className="text-[#94A3B8]" /> : <ChevronDown size={16} className="text-[#94A3B8]" />}
                    </div>
                  </div>
                  {expandedFile === i && (
                    <div className="border-t border-[#4A5578]/30">
                      <pre className="p-4 text-xs text-[#E2E8F0] overflow-x-auto custom-scrollbar max-h-[400px] font-mono leading-relaxed">
                        {file.code}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!data && !loading && !error && fullUrl && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#94A3B8]">
            <TestTube size={40} className="text-[#4A5578]" />
            <p className="text-sm">Select a framework and click "Generate Tests" to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestGenerator;
