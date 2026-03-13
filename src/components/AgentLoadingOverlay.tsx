import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentOrbLarge } from './AgentToggle';

interface AgentLoadingOverlayProps {
  statusText: string;
  phaseIndex: number;
  totalPhases: number;
}

export function AgentLoadingOverlay({ statusText, phaseIndex, totalPhases }: AgentLoadingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const progress = totalPhases > 0 ? ((phaseIndex + 1) / totalPhases) * 100 : 0;

  return (
    <motion.div
      className="agent-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="agent-overlay-card"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AgentOrbLarge size={100} />

        <div className="agent-overlay-status">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="agent-overlay-status-text"
            >
              {statusText}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="agent-overlay-progress-track">
          <motion.div
            className="agent-overlay-progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div className="agent-overlay-phase-dots">
          {Array.from({ length: totalPhases }).map((_, i) => (
            <span
              key={i}
              className={`agent-phase-dot ${i < phaseIndex ? 'done' : ''} ${i === phaseIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="agent-overlay-timer">
          Running for {timeStr}
        </div>
      </motion.div>
    </motion.div>
  );
}
