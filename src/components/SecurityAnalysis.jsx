import React from 'react';
import { ShieldAlert, AlertTriangle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

const mockIssues = [
  {
    id: '1',
    severity: 'CRITICAL',
    title: 'SQL Injection Vulnerability',
    location: 'routes/auth.js:47',
    description:
      'User input is directly concatenated into the SQL query string without sanitization.',
  },
  {
    id: '2',
    severity: 'HIGH',
    title: 'Hardcoded API Key',
    location: 'config/default.json:12',
    description: 'AWS Secret Key detected in plain text source code.',
  },
  {
    id: '3',
    severity: 'MEDIUM',
    title: 'Weak Hashing Algorithm',
    location: 'utils/crypto.js:22',
    description:
      'MD5 is used for password hashing. Recommend upgrading to Argon2 or bcrypt.',
  },
];

const SecurityAnalysis = () => {
  return (
    <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-8 hover:border-[#3B82F6]/50 transition-colors shadow-lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#4A5578]/30">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-[#F43F5E]" size={24} />
          <h2 className="text-xl font-semibold text-white">
            Security Analysis
          </h2>
        </div>
        <span className="text-[#94A3B8] text-sm">Last scan: 2m ago</span>
      </div>

      <div className="space-y-4">
        {mockIssues.map((issue) => (
          <div
            key={issue.id}
            className={clsx(
              'bg-[#1A1F3A] rounded-lg p-5 border-l-4 transition-transform hover:-translate-x-1',
              issue.severity === 'CRITICAL'
                ? 'border-l-[#F43F5E]'
                : issue.severity === 'HIGH'
                ? 'border-l-[#F59E0B]'
                : issue.severity === 'MEDIUM'
                ? 'border-l-[#06B6D4]'
                : 'border-l-[#10B981]'
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={clsx(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  issue.severity === 'CRITICAL'
                    ? 'bg-[#F43F5E]/20 text-[#F43F5E]'
                    : issue.severity === 'HIGH'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                    : issue.severity === 'MEDIUM'
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4]'
                    : 'bg-[#10B981]/20 text-[#10B981]'
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

            <div className="flex gap-3">
              <button className="text-xs px-3 py-1.5 border border-[#4A5578] rounded hover:bg-[#4A5578]/20 text-[#E2E8F0] transition-colors">
                View Code
              </button>
              <button className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded text-white font-medium hover:opacity-90 transition-opacity">
                See Fix <ExternalLink size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityAnalysis;
