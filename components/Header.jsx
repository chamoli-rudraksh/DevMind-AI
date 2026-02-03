import React from 'react';
import { Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const Header = ({ status, progressStep }) => {
  const steps = ['Input', 'Analyze', 'Results', 'Docs', 'Chat'];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0E27]/80 backdrop-blur-md border-b border-[#4A5578]/30 z-50 flex items-center justify-between px-6 lg:px-12">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#3B82F6] fill-[#3B82F6]" />
        <span className="text-xl font-semibold tracking-wide text-white">
          DevMind
        </span>
      </div>

      {/* Progress Indicator - Desktop */}
      <div className="hidden md:flex items-center gap-4">
        {steps.map((step, index) => {
          const isActive = index === progressStep;
          const isCompleted = index < progressStep;

          return (
            <div key={step} className="flex items-center gap-4">
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
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={
                    isActive ? { repeat: Infinity, duration: 2 } : {}
                  }
                />
              </div>

              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'h-[1px] w-8',
                    isCompleted
                      ? 'bg-[#06B6D4]/50'
                      : 'bg-[#4A5578]/30'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-3 bg-[#1A1F3A] border border-[#2A3254] px-3 py-1.5 rounded-full">
        <div className="relative flex items-center justify-center w-3 h-3">
          {status === 'analyzing' && (
            <span className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-75" />
          )}
          <div
            className={clsx(
              'w-2.5 h-2.5 rounded-full',
              status === 'idle'
                ? 'bg-emerald-500'
                : status === 'analyzing'
                ? 'bg-blue-500'
                : status === 'complete'
                ? 'bg-cyan-500'
                : 'bg-rose-500'
            )}
          />
        </div>

        <span className="text-xs font-medium tracking-wider text-[#E2E8F0]">
          {status === 'idle'
            ? 'READY'
            : status === 'analyzing'
            ? 'ANALYZING'
            : status === 'complete'
            ? 'COMPLETE'
            : 'ERROR'}
        </span>
      </div>
    </header>
  );
};

export default Header;
