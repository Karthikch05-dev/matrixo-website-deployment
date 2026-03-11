// ============================================================
// SkillDNA™ Analyzing Screen
// Beautiful AI-analyzing animation overlay
// ============================================================

'use client';

import { motion } from 'framer-motion';
import { FaDna, FaBrain, FaChartLine, FaRocket } from 'react-icons/fa';
import { useState, useEffect } from 'react';

interface AnalyzingScreenProps {
  stage?: string;
}

const stages = [
  { icon: FaBrain, text: 'Processing your data...', color: 'text-purple-400' },
  { icon: FaDna, text: 'Mapping your skill genome...', color: 'text-blue-400' },
  { icon: FaChartLine, text: 'Calculating scores...', color: 'text-cyan-400' },
  { icon: FaRocket, text: 'Generating learning paths...', color: 'text-green-400' },
];

export default function AnalyzingScreen({ stage }: AnalyzingScreenProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage(prev => (prev + 1) % stages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeStage = stages[currentStage];
  const Icon = activeStage.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/30 to-blue-950/30 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Spinning DNA ring */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-purple-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-4 border-blue-500/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-4 rounded-full border-4 border-cyan-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={currentStage}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`text-4xl ${activeStage.color}`}
            >
              <Icon />
            </motion.div>
          </div>
        </div>

        <motion.h2
          key={`text-${currentStage}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Analyzing Your SkillDNA™
        </motion.h2>

        <motion.p
          key={`desc-${currentStage}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm ${activeStage.color} font-medium mb-8`}
        >
          {activeStage.text}
        </motion.p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {stages.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${i === currentStage ? 'bg-purple-500' : 'bg-gray-700'}`}
              animate={i === currentStage ? { scale: [1, 1.5, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>

        <p className="text-xs text-gray-600 mt-8">
          This usually takes 15-30 seconds
        </p>
      </motion.div>
    </div>
  );
}
