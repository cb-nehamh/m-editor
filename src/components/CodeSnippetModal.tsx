import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CodeSnippetModalProps {
  open: boolean;
  onClose: () => void;
  configId: string;
  domain: string;
}

function getScriptSnippet(): string {
  return `<script src="https://js.chargebee.com/v2/chargebee.js"></script>
<script src="YOUR_MJS_BUNDLE_URL"></script>

<div id="el-ui-portal"></div>`;
}

function getInitSnippet(configId: string, domain: string): string {
  return `getCustomerSession().then(function (session) {
  MJS.setSession(session.token, '${domain}');
  MJS.openPortalComponent('#el-ui-portal', '${configId || 'YOUR_CONFIG_ID'}');
});`;
}

function getSessionSnippet(): string {
  return `// Implement this on your backend.
// It should create a Chargebee Portal Session and return { token }.
// See: https://apidocs.chargebee.com/docs/api/portal_sessions#create_a_portal_session

function getCustomerSession() {
  return fetch('/your-backend/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: 'CUSTOMER_ID' }),
  }).then(function (res) { return res.json(); });
}`;
}

interface SnippetBlockProps {
  label: string;
  langTag: string;
  code: string;
  stepNumber: number;
  description: React.ReactNode;
}

function SnippetBlock({ label, langTag, code, stepNumber, description }: SnippetBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: stepNumber === 1 ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#fff',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          width: 20, height: 20, borderRadius: 6,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{stepNumber}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, lineHeight: 1.5, paddingLeft: 28 }}>
        {description}
      </div>
      <div style={{
        border: '1px solid var(--color-border)', borderRadius: 10,
        background: '#1e293b', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 14px',
          borderBottom: '1px solid #334155',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{langTag}</span>
          <button
            onClick={handleCopy}
            style={{
              fontSize: 10, fontWeight: 600, padding: '3px 12px',
              background: copied ? '#166534' : '#334155',
              color: copied ? '#bbf7d0' : '#94a3b8',
              border: 'none', borderRadius: 5, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <pre style={{
          margin: 0, padding: '14px 18px', fontSize: 12,
          lineHeight: 1.6, color: '#e2e8f0',
          fontFamily: "'SF Mono', Menlo, Consolas, monospace",
          overflowX: 'auto', whiteSpace: 'pre', tabSize: 2,
        }}>{code}</pre>
      </div>
    </div>
  );
}

export function CodeSnippetModal({ open, onClose, configId, domain }: CodeSnippetModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 680,
              background: 'var(--color-surface)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                  Embed Code Snippet
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Add these snippets to your web page to render this portal component
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, background: 'var(--color-surface-alt)',
                  cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 16,
                }}
              >{'\u00D7'}</button>
            </div>

            {/* Snippet blocks */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
              <SnippetBlock
                stepNumber={1}
                label="Include scripts & mount point"
                langTag="html"
                description="Add the Chargebee JS SDK, the EL-UI bundle, and a container element where the component will render."
                code={getScriptSnippet()}
              />

              <SnippetBlock
                stepNumber={2}
                label="Initialize & render"
                langTag="js"
                description="Load the portal session and render the component into the mount point."
                code={getInitSnippet(configId, domain)}
              />

              <SnippetBlock
                stepNumber={3}
                label="getCustomerSession()"
                langTag="js"
                description={
                  <>
                    Implement this on your backend &mdash; it must create a Chargebee Portal Session and return the token.{' '}
                    <a
                      href="https://apidocs.chargebee.com/docs/api/portal_sessions#create_a_portal_session"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Portal Sessions API Docs &rarr;
                    </a>
                  </>
                }
                code={getSessionSnippet()}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
