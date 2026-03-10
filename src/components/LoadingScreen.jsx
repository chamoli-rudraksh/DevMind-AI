import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Cloning Repository', sub: 'Fetching latest codebase from GitHub' },
  { id: 2, label: 'Scanning Files', sub: 'Reading source code and project structure' },
  { id: 3, label: 'AI Analysis', sub: 'Gemini is processing and understanding the code' },
  { id: 4, label: 'Building Insights', sub: 'Compiling security, quality, and architecture data' },
];

const LoadingScreen = ({ onComplete, repoName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const stepDuration = 2200;
    let step = 0;

    const advance = () => {
      step++;
      setCurrentStep(step);
      if (step >= STEPS.length) {
        setDone(true);
        setTimeout(onComplete, 600);
      } else {
        setTimeout(advance, stepDuration);
      }
    };

    const timer = setTimeout(advance, stepDuration);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center"
    >
      {/* Spinner */}
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-[#2A3254]" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#3B82F6] border-r-[#06B6D4] animate-spin" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/20 flex items-center justify-center">
          <Loader2 size={24} className="text-[#3B82F6] animate-pulse" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {done ? '✨ Analysis Complete!' : 'Analyzing Repository'}
      </h2>
      {repoName && (
        <p className="text-sm text-[#94A3B8] mb-10 font-mono">{repoName}</p>
      )}

      {/* Steps */}
      <div className="w-full max-w-md space-y-3">
        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30'
                  : isCompleted
                  ? 'bg-[#10B981]/5 border-[#10B981]/20'
                  : 'bg-[#1A1F3A] border-[#2A3254] opacity-50'
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle size={20} className="text-[#10B981]" />
                ) : isActive ? (
                  <Loader2 size={20} className="text-[#3B82F6] animate-spin" />
                ) : (
                  <Circle size={20} className="text-[#4A5578]" />
                )}
              </div>
              <div className="text-left">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : isCompleted ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-[#94A3B8]">{step.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
