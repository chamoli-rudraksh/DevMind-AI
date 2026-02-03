import React, { useState } from 'react';
import { Folder, FileCode, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const mockTree = {
  name: 'root',
  type: 'folder',
  children: [
    {
      name: 'packages',
      type: 'folder',
      children: [
        {
          name: 'core',
          type: 'folder',
          children: [
            { name: 'index.js', type: 'file', isEntry: true },
            { name: 'types.js', type: 'file' },
            { name: 'utils.js', type: 'file' },
          ],
        },
        {
          name: 'ui',
          type: 'folder',
          children: [
            { name: 'Button.jsx', type: 'file' },
            { name: 'Card.jsx', type: 'file' },
          ],
        },
      ],
    },
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'App.jsx', type: 'file' },
        { name: 'main.jsx', type: 'file' },
      ],
    },
    { name: 'package.json', type: 'file' },
    { name: 'tsconfig.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ],
};

const TreeNode = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(
    node.name === 'root' || depth < 1
  );

  const isFolder = node.type === 'folder';

  if (node.name === 'root' && node.children) {
    return (
      <div className="space-y-1">
        {node.children.map((child, i) => (
          <TreeNode key={i} node={child} depth={0} />
        ))}
      </div>
    );
  }

  return (
    <div className="select-none">
      <div
        className={clsx(
          'flex items-center gap-2 py-1 px-2 rounded hover:bg-[#3B82F6]/10 transition-colors cursor-pointer',
          depth > 0 && 'ml-5'
        )}
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        <span className="text-[#4A5578]">
          {isFolder ? (isOpen ? '▼' : '▶') : ' '}
        </span>

        {isFolder ? (
          <Folder size={16} className="text-[#06B6D4]" />
        ) : (
          <FileCode size={16} className="text-[#94A3B8]" />
        )}

        <span
          className={clsx(
            'font-mono text-sm',
            isFolder
              ? 'text-[#E2E8F0] font-medium'
              : 'text-[#94A3B8]',
            node.isEntry && 'text-[#10B981]'
          )}
        >
          {node.name}
        </span>

        {node.isEntry && (
          <span className="text-[10px] text-[#10B981] opacity-70 ml-2">
            ← Entry
          </span>
        )}
      </div>

      <AnimatePresence>
        {isFolder && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-l border-[#4A5578]/30 ml-[13px]">
              {node.children.map((child, i) => (
                <TreeNode
                  key={i}
                  node={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectStructure = () => {
  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 hover:border-[#3B82F6]/50 transition-colors shadow-lg h-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#4A5578]/30">
        <Package className="text-[#3B82F6]" size={24} />
        <h2 className="text-xl font-semibold text-white">
          Project Structure
        </h2>
      </div>

      <div className="bg-[#0A0E27]/30 rounded-lg p-4 overflow-x-auto min-h-[300px]">
        <TreeNode node={mockTree} depth={0} />
        <div className="mt-4 text-xs text-[#4A5578] italic pl-2">
          [24 more files hidden...]
        </div>
      </div>
    </div>
  );
};

export default ProjectStructure;
