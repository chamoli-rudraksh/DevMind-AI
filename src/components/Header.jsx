import React from 'react';
import { Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const Header = ({ status, progressStep, repoName, onReset }) => {
  const steps = ['Input', 'Analyze', 'Results'];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0E27]/90 backdrop-blur-lg border-b border-[#4A5578]/30 z-50 flex items-center justify-between px-4 lg:px-8">
      {/* Logo + Reset */}
      <div className="flex items-center gap-3">
        <button
          onClick={status === 'complete' && onReset ? onReset : undefined}
          className={clsx(
            "flex items-center gap-2 transition-all group",
            status === 'complete' && onReset ? "cursor-pointer" : "cursor-default"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            DevMind<span className="text-[#3B82F6]">AI</span>
          </span>
        </button>

        {/* Repo breadcrumb */}
        {status === 'complete' && repoName && (
          <div className="hidden md:flex items-center gap-2 ml-1">
            <span className="text-[#4A5578]">/</span>
            <span className="text-sm text-[#94A3B8] font-mono truncate max-w-[200px]">{repoName}</span>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {status !== 'idle' && (
        <div className="hidden md:flex items-center gap-3">
          {steps.map((step, index) => {
            const isActive = index === progressStep;
            const isCompleted = index < progressStep;

            return (
              <div key={step} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    className={clsx(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      isActive
                        ? 'bg-[#3B82F6] shadow-[0_0_0_4px_rgba(59,130,246,0.2)]'
                        : isCompleted
                        ? 'bg-[#06B6D4]'
                        : 'bg-[#4A5578]'
                    )}
                    animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                    transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                  />
                  <span className={clsx("text-[9px] font-medium uppercase tracking-wide", isActive ? "text-[#3B82F6]" : isCompleted ? "text-[#06B6D4]" : "text-[#4A5578]")}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={clsx('h-[1px] w-8', isCompleted ? 'bg-[#06B6D4]/50' : 'bg-[#4A5578]/30')} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Analyze New Repo button (desktop) */}
        {status === 'complete' && onReset && (
          <button
            onClick={onReset}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1F3A] border border-[#4A5578]/50 rounded-lg text-[#94A3B8] hover:text-white hover:border-[#3B82F6]/50 transition-all text-xs font-medium"
          >
            <ArrowLeft size={12} />
            New Repo
          </button>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-[#1A1F3A] border border-[#2A3254] px-3 py-1.5 rounded-full">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            {status === 'analyzing' && (
              <span className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75" />
            )}
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                status === 'idle' ? 'bg-emerald-500'
                  : status === 'analyzing' ? 'bg-blue-500'
                  : status === 'complete' ? 'bg-cyan-500'
                  : 'bg-rose-500'
              )}
            />
          </div>
          <span className="text-[10px] font-semibold tracking-widest text-[#E2E8F0]">
            {status === 'idle' ? 'READY'
              : status === 'analyzing' ? 'ANALYZING'
              : status === 'complete' ? 'COMPLETE'
              : 'ERROR'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
