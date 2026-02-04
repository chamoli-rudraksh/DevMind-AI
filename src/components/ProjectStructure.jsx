import React, { useState, useEffect } from "react";
import { Folder, File, ChevronRight, ChevronDown, Loader2 } from "lucide-react";

const FileTreeNode = ({ node, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === "folder";
  const paddingLeft = level * 16;

  const handleToggle = () => {
    if (isFolder) setIsOpen(!isOpen);
  };

  return (
    <div>
      <div
        onClick={handleToggle}
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#3B82F6]/10 rounded cursor-pointer text-sm text-[#E2E8F0] transition-colors select-none"
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        <span className="opacity-70 shrink-0">
          {isFolder ? (
            isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </span>

        <span className={isFolder ? "text-[#F59E0B]" : "text-[#3B82F6]"}>
          {isFolder ? <Folder size={16} /> : <File size={16} />}
        </span>

        <span className="truncate">{node.name}</span>
      </div>

      {isOpen && node.children && (
        <div>
          {node.children.map((child, idx) => (
            <FileTreeNode
              key={`${child.name}-${idx}`}
              node={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectStructure = ({ fullUrl }) => {
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fullUrl) return;

    const fetchStructure = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/structure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: fullUrl }),
        });
        const data = await res.json();
        setStructure(data.structure || []);
      } catch (e) {
        console.error("Failed to load structure", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStructure();
  }, [fullUrl]);

  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 shadow-lg flex flex-col h-full min-h-[400px]">
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Folder className="text-[#3B82F6]" /> Project Structure
      </h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[#94A3B8] gap-2">
            <Loader2 className="animate-spin" /> Loading tree...
          </div>
        ) : (
          <div className="space-y-1">
            {structure.map((node, idx) => (
              <FileTreeNode key={idx} node={node} />
            ))}
            {structure.length === 0 && (
              <p className="text-[#94A3B8] italic p-4">Structure unavailable</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStructure;
