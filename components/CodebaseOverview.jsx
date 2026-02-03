import React from 'react';
import { BarChart3 } from 'lucide-react';

const CodebaseOverview = ({ repoName }) => {
  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-8 hover:border-[#3B82F6]/50 transition-colors shadow-lg">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#4A5578]/30">
        <BarChart3 className="text-[#3B82F6]" size={24} />
        <h2 className="text-xl font-semibold text-white">
          Codebase Overview
        </h2>
      </div>

      <h3 className="text-3xl font-bold text-white mb-2">
        {repoName.split('/')[1] || 'Repository'}
      </h3>

      <p className="text-[#E2E8F0] mb-8 leading-relaxed max-w-2xl">
        A declarative, efficient, and flexible library for building user
        interfaces. High complexity detected in core reconciliation logic.
      </p>

      <div className="grid grid-cols-4 gap-0 bg-[#1A1F3A] rounded-xl border border-[#4A5578]/30 overflow-hidden mb-8">
        {[
          { label: 'Files', value: '1,247' },
          { label: 'Lines', value: '89.2K' },
          { label: 'Lang', value: 'TS' },
          { label: 'Complexity', value: 'A+' },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-6 border-r border-[#4A5578]/30 last:border-r-0 hover:bg-[#2A3254]/50 transition-colors"
          >
            <span className="text-xs uppercase tracking-wider text-[#94A3B8] mb-1">
              {stat.label}
            </span>
            <span className="text-2xl font-bold text-white">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="text-sm text-[#94A3B8] font-mono mb-2">
          Entry Point:{' '}
          <span className="text-[#E2E8F0]">
            packages/core/index.js
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          Tech Stack
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            'TypeScript',
            'React',
            'Vite',
            'Tailwind',
            'Jest',
            'ESLint',
          ].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 rounded-md bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-sm font-medium hover:bg-[#3B82F6]/20 transition-colors cursor-default"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodebaseOverview;
