import React, { useEffect, useState } from 'react';
import { Check, Loader2, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { id: '1', label: 'Cloning repository', status: 'pending' },
    { id: '2', label: 'Detecting languages', status: 'pending' },
    { id: '3', label: 'Analyzing structure', status: 'pending' },
    { id: '4', label: 'Scanning security', status: 'pending' },
    { id: '5', label: 'Generating summary', status: 'pending' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1; // ~5 seconds total
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateStep = (index, status) => {
      setSteps((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status };
        return next;
      });
    };

    if (progress > 5 && steps[0].status === 'pending') updateStep(0, 'active');
    if (progress > 20 && steps[0].status === 'active') {
      updateStep(0, 'complete');
      updateStep(1, 'active');
    }
    if (progress > 40 && steps[1].status === 'active') {
      updateStep(1, 'complete');
      updateStep(2, 'active');
    }
    if (progress > 60 && steps[2].status === 'active') {
      updateStep(2, 'complete');
      updateStep(3, 'active');
    }
    if (progress > 80 && steps[3].status === 'active') {
      updateStep(3, 'complete');
      updateStep(4, 'active');
    }
    if (progress >= 100 && steps[4].status === 'active') {
      updateStep(4, 'complete');
      setTimeout(onComplete, 800);
    }
  }, [progress, steps, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-6">
      {/* Progress Card */}
      <div className="w-full bg-[#1A1F3A] border border-[#2A3254] rounded-2xl p-8 mb-8 shadow-2xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">
              Analyzing repository...
            </h3>
            <p className="text-[#94A3B8] text-sm font-mono">
              {progress}% • Processing files
            </p>
          </div>
          <div className="text-[#3B82F6]">
            <Loader2 className="animate-spin" size={24} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[#2A3254] rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] translate-x-[-100%]" />
          </motion.div>
        </div>
      </div>

      {/* Steps */}
      <div className="w-full space-y-4">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg border border-transparent"
          >
            <span className="text-[#E2E8F0] font-mono text-sm">
              {step.label}
            </span>

            <div>
              {step.status === 'pending' && (
                <Pause size={18} className="text-[#4A5578]" />
              )}
              {step.status === 'active' && (
                <Loader2
                  size={18}
                  className="text-[#3B82F6] animate-spin"
                />
              )}
              {step.status === 'complete' && (
                <Check size={18} className="text-[#10B981]" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
