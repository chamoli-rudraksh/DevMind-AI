import React, { useState } from 'react';
import { ArrowRight, Github, Sparkles, Shield, FileText, MessageSquare, Gauge, GitBranch, TestTube } from 'lucide-react';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: Gauge, label: "Code Quality", desc: "AI-powered maintainability scores & grade", color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
  { icon: Shield, label: "Security Audit", desc: "Multi-tool vulnerability scanning", color: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10" },
  { icon: TestTube, label: "Test Generation", desc: "Auto-generate unit tests with AI", color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  { icon: FileText, label: "Docs Generation", desc: "README, ARCHITECTURE, API docs", color: "text-[#EC4899]", bg: "bg-[#EC4899]/10" },
  { icon: GitBranch, label: "Git Insights", desc: "Contributor analytics & history", color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
  { icon: MessageSquare, label: "AI Chat", desc: "Ask anything about the codebase", color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
];

const QUICK_REPOS = ['vercel/next.js', 'facebook/react', 'expressjs/express'];

const Hero = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { setUrlError('Please enter a GitHub URL'); return; }
    setUrlError('');
    onAnalyze(trimmed);
  };

  const handleQuickLink = (repo) => {
    const fullUrl = `https://github.com/${repo}`;
    setUrl(fullUrl);
    setUrlError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 text-center max-w-6xl mx-auto">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-full mb-8"
      >
        <Sparkles size={14} className="text-[#3B82F6]" />
        <span className="text-xs font-medium text-[#3B82F6]">AI-Powered Codebase Intelligence</span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight"
      >
        Understand Any{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]">
          Codebase
        </span>{' '}
        Instantly
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-lg md:text-xl text-[#94A3B8] mb-10 max-w-2xl font-light leading-relaxed"
      >
        Deep security audits, code quality scores, AI-generated docs, unit test generation, and git analytics — all from a single GitHub URL.
      </motion.p>

      {/* Input */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-2xl"
      >
        <div className="relative flex items-center mb-3">
          <div className="absolute left-5 text-[#94A3B8] pointer-events-none">
            <Github size={20} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(''); }}
            placeholder="https://github.com/username/repository"
            className={`w-full h-14 pl-14 pr-4 bg-[#2A3254] border ${urlError ? 'border-red-500' : 'border-[#4A5578]'} rounded-2xl text-white placeholder-[#4A5578] focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-mono text-sm md:text-base shadow-2xl`}
          />
        </div>
        {urlError && <p className="text-red-400 text-xs mb-2 text-left px-1">{urlError}</p>}

        <div className="flex justify-center">
          <button
            type="submit"
            className="group relative flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl font-semibold text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden text-base"
          >
            <span className="relative z-10">Analyze Repository</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-6" />
          </button>
        </div>
      </motion.form>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 flex flex-wrap justify-center gap-2 items-center text-sm text-[#94A3B8]"
      >
        <span>Try:</span>
        {QUICK_REPOS.map((repo) => (
          <button
            key={repo}
            onClick={() => handleQuickLink(repo)}
            className="px-3 py-1.5 bg-[#1A1F3A] border border-[#2A3254] rounded-full hover:bg-[#2A3254] hover:border-[#3B82F6]/50 transition-colors text-[#E2E8F0] text-xs font-mono"
          >
            {repo}
          </button>
        ))}
      </motion.div>

      {/* Feature grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-20 w-full grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {FEATURES.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className="flex items-start gap-3 p-4 bg-[#1A1F3A] border border-[#2A3254] rounded-xl hover:border-[#4A5578] transition-colors text-left group"
          >
            <div className={`w-8 h-8 rounded-lg ${feature.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <feature.icon size={16} className={feature.color} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{feature.label}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default Hero;
