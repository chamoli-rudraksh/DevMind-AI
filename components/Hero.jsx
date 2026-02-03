import React, { useState } from 'react';
import { ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = ({ onAnalyze }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) onAnalyze(url);
  };

  const handleQuickLink = (repo) => {
    const fullUrl = `https://github.com/${repo}`;
    setUrl(fullUrl);
    // Optional auto-submit:
    // onAnalyze(fullUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-4xl mx-auto"
    >
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
        Analyze Any Codebase
      </h1>

      <p className="text-lg md:text-xl text-[#94A3B8] mb-12 max-w-2xl font-light">
        Understanding at the speed of AI. Deep insights, security audits, and documentation in seconds.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group">
        <div className="relative flex items-center">
          <div className="absolute left-5 text-[#94A3B8]">
            <Github size={20} />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full h-14 pl-14 pr-4 bg-[#2A3254] border border-[#4A5578] rounded-xl text-white placeholder-[#4A5578] focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all font-mono text-sm md:text-base shadow-lg"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="group relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-xl font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden"
          >
            <span className="relative z-10">Analyze Repository</span>
            <ArrowRight
              size={18}
              className="relative z-10 group-hover:translate-x-1 transition-transform"
            />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
          </button>
        </div>
      </form>

      <div className="mt-12 flex flex-wrap justify-center gap-4 items-center text-sm text-[#94A3B8]">
        <span>or try:</span>
        {['facebook/react', 'expressjs/express', 'tensorflow/tensorflow'].map(
          (repo) => (
            <button
              key={repo}
              onClick={() => handleQuickLink(repo)}
              className="px-4 py-2 bg-[#1A1F3A] border border-[#2A3254] rounded-full hover:bg-[#2A3254] hover:border-[#3B82F6]/50 transition-colors text-[#E2E8F0]"
            >
              {repo}
            </button>
          )
        )}
      </div>
    </motion.div>
  );
};

export default Hero;
