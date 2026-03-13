import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentToggleProps {
  active: boolean;
  onClick: () => void;
}

export function AgentToggle({ active, onClick }: AgentToggleProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="agent-toggle-floating"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mascot peeking from behind the orb */}
      <AnimatePresence>
        {hovered && (
          <>
            {/* Speech bubble */}
            <motion.div
              className="agent-tooltip-bubble"
              initial={{ opacity: 0, y: 8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.15 }}
            >
              Hello! I'm your buddy <strong>Magno</strong>
              <span className="agent-tooltip-tail" />
            </motion.div>

            {/* Mascot head */}
            <motion.div
              className="agent-mascot"
              initial={{ y: 20, opacity: 0, scale: 0.7 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            >
              <div className="agent-mascot-face">
                <div className="agent-mascot-eye agent-mascot-eye-l" />
                <div className="agent-mascot-eye agent-mascot-eye-r" />
                <div className="agent-mascot-mouth" />
                <div className="agent-mascot-antenna" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Glowing orb button */}
      <motion.button
        className={`agent-toggle-btn ${active ? 'agent-toggle-active' : ''}`}
        onClick={onClick}
        title="Toggle AI Agent (⌘A)"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <div className="agent-toggle-orb">
          <div className="agent-toggle-ring agent-toggle-ring-1" />
          <div className="agent-toggle-ring agent-toggle-ring-2" />
          <div className="agent-toggle-ring agent-toggle-ring-3" />
          <div className="agent-toggle-core" />
        </div>
      </motion.button>
    </div>
  );
}

export function AgentOrbLarge({ size = 120 }: { size?: number }) {
  return (
    <div className="agent-orb-large" style={{ width: size, height: size }}>
      <div className="agent-toggle-ring agent-toggle-ring-1" />
      <div className="agent-toggle-ring agent-toggle-ring-2" />
      <div className="agent-toggle-ring agent-toggle-ring-3" />
      <div className="agent-toggle-core" style={{ width: size * 0.25, height: size * 0.25 }} />
      <div className="agent-orb-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="agent-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
