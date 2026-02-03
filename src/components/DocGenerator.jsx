import React, { useState } from "react";
import { FileText, Loader2, Check, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

// We removed the import from '../services/gemini'
// because we are now calling the Python backend.

const DocGenerator = ({ repoUrl }) => {
  // Changed repoName to repoUrl
  const [docs, setDocs] = useState([
    { id: "1", filename: "README.md", status: "idle" },
    { id: "2", filename: "CONTRIBUTING.md", status: "idle" },
    { id: "3", filename: "ARCHITECTURE.md", status: "idle" },
  ]);

  const [activePreview, setActivePreview] = useState(null);

  const handleGenerate = async (docId) => {
    // 1. Set status to loading
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "loading" } : d)),
    );

    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;

    try {
      // 2. CALL THE PYTHON BACKEND
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: repoUrl, // Send the GitHub URL
          doc_type: doc.filename, // Send which file we want (README vs CONTRIBUTING)
        }),
      });

      if (!response.ok) throw new Error("Backend failed");

      const data = await response.json();
      const content = data.markdown;

      // 3. Update state with the result from Python
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "complete", content } : d,
        ),
      );

      setActivePreview(docId);
    } catch (error) {
      console.error("Generation failed:", error);
      // Reset status on error
      setDocs((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "idle" } : d)),
      );
      alert("Failed to generate docs. Is the Python backend running?");
    }
  };

  const activeDoc = docs.find((d) => d.id === activePreview);

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-8 hover:border-[#3B82F6]/50 transition-colors shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#4A5578]/30">
        <FileText className="text-[#3B82F6]" size={24} />
        <h2 className="text-xl font-semibold text-white">
          Generate Documentation
        </h2>
      </div>

      <p className="text-[#94A3B8] mb-8">
        Auto-create professional docs for your repo using AI context analysis.
      </p>

      {/* WARNING IF NO URL */}
      {!repoUrl && (
        <div className="text-red-400 mb-4 text-sm bg-red-900/20 p-2 rounded">
          Please enter a valid GitHub URL above first.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {docs.map((doc) => (
          <button
            key={doc.id}
            disabled={doc.status === "loading" || !repoUrl}
            onClick={() =>
              doc.status === "complete"
                ? setActivePreview(doc.id)
                : handleGenerate(doc.id)
            }
            className={`relative flex flex-col items-center justify-center p-6 rounded-xl border transition-all ${
              doc.status === "loading"
                ? "bg-[#1A1F3A] border-[#4A5578] opacity-70 cursor-wait"
                : doc.status === "complete"
                  ? "bg-[#1A1F3A] border-[#10B981] hover:shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                  : "bg-[#1A1F3A] border-[#4A5578] hover:border-[#3B82F6] hover:-translate-y-1 hover:shadow-lg"
            }`}
          >
            {doc.status === "loading" ? (
              <Loader2 className="animate-spin text-[#3B82F6] mb-3" size={28} />
            ) : doc.status === "complete" ? (
              <Check className="text-[#10B981] mb-3" size={28} />
            ) : (
              <FileText className="text-[#E2E8F0] mb-3" size={28} />
            )}

            <span className="text-white font-mono font-medium text-sm mb-2">
              {doc.filename}
            </span>

            <span
              className={`text-xs ${doc.status === "complete" ? "text-[#10B981]" : "text-[#94A3B8]"}`}
            >
              {doc.status === "idle"
                ? "Click to generate"
                : doc.status === "loading"
                  ? "Generating..."
                  : "View Document"}
            </span>
          </button>
        ))}
      </div>

      {activeDoc && activeDoc.content && (
        <div className="bg-[#0A0E27]/50 rounded-xl border border-[#4A5578]/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1A1F3A] border-b border-[#4A5578]/30">
            <span className="font-mono text-sm text-[#E2E8F0]">
              {activeDoc.filename}
            </span>
            <button className="flex items-center gap-2 text-xs text-[#3B82F6] hover:text-[#3B82F6]/80">
              <Download size={14} /> Download
            </button>
          </div>

          <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-a:text-[#3B82F6] prose-code:text-[#06B6D4] prose-pre:bg-[#0A0E27]">
              <ReactMarkdown>{activeDoc.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocGenerator;
