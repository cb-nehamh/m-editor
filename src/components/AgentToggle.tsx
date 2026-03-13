import React from 'react';
import { motion } from 'framer-motion';

interface AgentToggleProps {
  active: boolean;
  onClick: () => void;
}

export function AgentToggle({ active, onClick }: AgentToggleProps) {
  return (
    <motion.button
      className={`agent-toggle-btn ${active ? 'agent-toggle-active' : ''}`}
      onClick={onClick}
      title="Toggle AI Agent (⌘A)"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.92 }}
    >
      <div className="agent-toggle-orb">
        <div className="agent-toggle-ring agent-toggle-ring-1" />
        <div className="agent-toggle-ring agent-toggle-ring-2" />
        <div className="agent-toggle-ring agent-toggle-ring-3" />
        <div className="agent-toggle-core" />
      </div>
    </motion.button>
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
