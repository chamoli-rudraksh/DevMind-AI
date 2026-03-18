import React, { useState } from "react";
import { FileText, Loader2, Check, Download, Copy, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";

const ALL_DOCS = [
  { id: "1", filename: "README.md", icon: "📄", desc: "Project overview & setup guide" },
  { id: "2", filename: "CONTRIBUTING.md", icon: "🤝", desc: "Contribution guidelines & PR process" },
  { id: "3", filename: "ARCHITECTURE.md", icon: "🏗️", desc: "System design & technical decisions" },
  { id: "4", filename: "API.md", icon: "🔌", desc: "API endpoints & usage reference" },
];

const DocGenerator = ({ repoUrl }) => {
  const [docs, setDocs] = useState(ALL_DOCS.map((d) => ({ ...d, status: "idle" })));
  const [activePreview, setActivePreview] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleGenerate = async (docId) => {
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "loading" } : d)));
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: repoUrl, doc_type: doc.filename }),
      });
      if (!response.ok) throw new Error("Backend failed");
      const data = await response.json();
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "complete", content: data.markdown } : d)));
      setActivePreview(docId);
    } catch (error) {
      console.error("Generation failed:", error);
      setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: "idle" } : d)));
    }
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeDoc = docs.find((d) => d.id === activePreview);

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 hover:border-[#EC4899]/30 transition-colors shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#EC4899]/10 flex items-center justify-center">
          <FileText className="text-[#EC4899]" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Documentation Generator</h2>
          <p className="text-sm text-[#94A3B8]">AI-crafted professional docs from your codebase</p>
        </div>
      </div>

      {!repoUrl && (
        <div className="text-amber-400 mb-4 text-sm bg-amber-900/20 p-3 rounded-lg border border-amber-500/20">
          Please analyze a repository first to generate docs.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {docs.map((doc) => (
          <button
            key={doc.id}
            disabled={doc.status === "loading" || !repoUrl}
            onClick={() => doc.status === "complete" ? setActivePreview(doc.id) : handleGenerate(doc.id)}
            className={`relative flex flex-col items-center justify-center p-5 rounded-xl border transition-all ${
              doc.status === "loading"
                ? "bg-[#1A1F3A] border-[#4A5578] opacity-70 cursor-wait"
                : doc.status === "complete"
                  ? "bg-[#1A1F3A] border-[#10B981] hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:-translate-y-0.5"
                  : "bg-[#1A1F3A] border-[#4A5578] hover:border-[#EC4899]/50 hover:-translate-y-1 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            }`}
          >
            <span className="text-2xl mb-2">{doc.icon}</span>
            {doc.status === "loading" ? (
              <Loader2 className="animate-spin text-[#3B82F6] mb-2" size={20} />
            ) : doc.status === "complete" ? (
              <Check className="text-[#10B981] mb-2" size={20} />
            ) : null}
            <span className="text-white font-mono font-medium text-xs mb-1">{doc.filename}</span>
            <span className={`text-[10px] text-center ${doc.status === "complete" ? "text-[#10B981]" : "text-[#94A3B8]"}`}>
              {doc.status === "idle" ? doc.desc : doc.status === "loading" ? "Generating..." : "Click to preview"}
            </span>
          </button>
        ))}
      </div>

      {activeDoc?.content && (
        <div className="bg-[#0A0E27]/50 rounded-xl border border-[#4A5578]/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1A1F3A] border-b border-[#4A5578]/30">
            <span className="font-mono text-sm text-[#E2E8F0]">{activeDoc.filename}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeDoc.content, activeDoc.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#4A5578]/30 transition-colors"
              >
                {copiedId === activeDoc.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedId === activeDoc.id ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => handleDownload(activeDoc.content, activeDoc.filename)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#3B82F6] hover:text-white bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 rounded-lg transition-colors"
              >
                <Download size={12} /> Download
              </button>
            </div>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-[#3B82F6] prose-code:text-[#06B6D4] prose-pre:bg-[#0A0E27] prose-code:bg-[#0A0E27] prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{activeDoc.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocGenerator;
