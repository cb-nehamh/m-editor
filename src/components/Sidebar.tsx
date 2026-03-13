import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { componentRegistry, registryMap, type ComponentDef } from '../component-registry';
import { useEditor, LAYOUT_DEFS, type LayoutType, type EditorComponent, getActiveSection, collectAllComponents } from '../state';
import { useTheme, type EditorTheme } from '../commons';

function LayoutThumbnail({ type, label, isActive, onClick }: {
  type: LayoutType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const columns: React.CSSProperties = (() => {
    switch (type) {
      case 'fullWidth': return { gridTemplateColumns: '1fr' };
      case 'twoColumn': return { gridTemplateColumns: '1fr 1fr' };
      case 'sidebar': return { gridTemplateColumns: '1fr 2.5fr' };
    }
  })();
  const regionCount = type === 'fullWidth' ? 1 : 2;

  return (
    <motion.button
      whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '8px 6px', borderRadius: 'var(--radius-md)',
        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
        cursor: 'pointer', transition: 'all var(--transition-fast)',
        flex: 1,
      }}
    >
      <div style={{ display: 'grid', ...columns, gap: 2, width: '100%', height: 26 }}>
        {Array.from({ length: regionCount }).map((_, i) => (
          <div key={i} style={{
            background: isActive ? 'var(--color-primary-border)' : 'var(--color-border)',
            borderRadius: 3,
            border: `1px solid ${isActive ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
          }} />
        ))}
      </div>
      <div style={{
        fontSize: 9, fontWeight: isActive ? 700 : 500,
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {label}
      </div>
    </motion.button>
  );
}

function DraggablePaletteItem({ def }: { def: ComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.id}`,
    data: { type: def.id },
    disabled: !!def.comingSoon,
  });

  return (
    <div
      ref={setNodeRef}
      {...(def.comingSoon ? {} : listeners)}
      {...(def.comingSoon ? {} : attributes)}
      className={`palette-item${isDragging ? ' dragging' : ''}${def.comingSoon ? ' coming-soon' : ''}`}
      style={def.comingSoon ? { opacity: 0.6, cursor: 'default' } : undefined}
    >
      <span className="palette-icon">{def.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          {def.label}
          {def.comingSoon && (
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', padding: '1px 5px', borderRadius: 3,
              letterSpacing: '0.04em', lineHeight: '14px',
            }}>Coming Soon</span>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400, marginTop: 1 }}>{def.description}</div>
      </div>
    </div>
  );
}

function SectionBlock({ title, defaultOpen = true, badge, children }: {
  title: string; defaultOpen?: boolean; badge?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', border: 'none', background: 'transparent',
          cursor: 'pointer', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 700, background: 'var(--color-primary-light)',
              color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 10,
            }}>{badge}</span>
          )}
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.15 }}
          style={{ fontSize: 9, color: 'var(--color-text-muted)' }}
        >
          {'\u25BC'}
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 12px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeCard({ value, label, isActive, onClick }: {
  value: EditorTheme;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const isBlack = value === 'dark';
  return (
    <motion.button
      whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        padding: '8px 6px', borderRadius: 'var(--radius-md)',
        border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
        cursor: 'pointer', transition: 'all var(--transition-fast)',
        flex: 1,
      }}
    >
      <div style={{
        width: '100%', height: 32, borderRadius: 4,
        background: isBlack ? '#0a0a0a' : '#ffffff',
        border: `1px solid ${isBlack ? '#333' : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        padding: '0 6px',
      }}>
        <div style={{
          width: '60%', height: 4, borderRadius: 2,
          background: isBlack ? '#333' : '#e2e8f0',
        }} />
        <div style={{
          width: '20%', height: 4, borderRadius: 2,
          background: isBlack ? '#444' : '#cbd5e1',
        }} />
      </div>
      <div style={{
        fontSize: 9, fontWeight: isActive ? 700 : 500,
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        textAlign: 'center', lineHeight: 1.2,
      }}>
        {label}
      </div>
    </motion.button>
  );
}

export function Sidebar() {
  const { state, dispatch } = useEditor();
  const { theme, setTheme } = useTheme();
  const activeSection = getActiveSection(state);
  const [search, setSearch] = useState('');

  const filteredComponents = search
    ? componentRegistry.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase())
      )
    : componentRegistry;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="floating-panel-header">
        <h3>Component Palette</h3>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {state.sections.length} section{state.sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="floating-panel-body" style={{ flex: 1 }}>
        {/* Section tabs */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {state.sections.map((s, i) => (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => dispatch({ type: 'SELECT_SECTION', payload: s.id })}
                style={{
                  padding: '4px 10px', fontSize: 10,
                  fontWeight: s.id === state.activeSectionId ? 700 : 500,
                  background: s.id === state.activeSectionId
                    ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                    : 'var(--color-surface-alt)',
                  color: s.id === state.activeSectionId ? '#fff' : 'var(--color-text-muted)',
                  border: 'none', borderRadius: 5, cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: s.id === state.activeSectionId ? '0 2px 6px rgba(59,130,246,0.25)' : 'none',
                }}
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Theme picker */}
        <SectionBlock title="Theme" defaultOpen={true}>
          <div style={{ display: 'flex', gap: 5 }}>
            <ThemeCard
              value="light"
              label="White"
              isActive={theme === 'light'}
              onClick={() => { setTheme('light'); dispatch({ type: 'SET_THEME', payload: 'light' }); }}
            />
            <ThemeCard
              value="dark"
              label="Black"
              isActive={theme === 'dark'}
              onClick={() => { setTheme('dark'); dispatch({ type: 'SET_THEME', payload: 'dark' }); }}
            />
          </div>
        </SectionBlock>

        {/* Layout picker */}
        {activeSection && (
          <SectionBlock title="Layout" defaultOpen={true}>
            <div style={{ display: 'flex', gap: 5 }}>
              {LAYOUT_DEFS.map((def) => (
                <LayoutThumbnail
                  key={def.type}
                  type={def.type}
                  label={def.label}
                  isActive={activeSection.layout === def.type}
                  onClick={() => dispatch({ type: 'SET_LAYOUT', payload: def.type })}
                />
              ))}
            </div>
            {activeSection.layout === 'sidebar' && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Split</label>
                <input
                  type="range" min={15} max={50} step={5}
                  value={activeSection.splitRatio}
                  onChange={(e) => dispatch({ type: 'SET_SPLIT', payload: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', minWidth: 42, textAlign: 'right' }}>
                  {activeSection.splitRatio}/{100 - activeSection.splitRatio}
                </span>
              </div>
            )}
          </SectionBlock>
        )}

        {/* Components */}
        <SectionBlock title="Components" defaultOpen={true} badge={`${filteredComponents.length}`}>
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ marginBottom: 8, fontSize: 11, padding: '5px 10px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredComponents.map((def) => (
              <DraggablePaletteItem key={def.id} def={def} />
            ))}
          </div>
        </SectionBlock>

        {/* Placed Components */}
        {(() => {
          const allComps = collectAllComponents(state.sections);
          return (
            <SectionBlock title="Placed Components" defaultOpen={false} badge={allComps.length > 0 ? `${allComps.length}` : undefined}>
              {allComps.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Drag components to start building
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {allComps.map((node) => {
                    const def = registryMap.get(node.type);
                    const isSelected = state.selectedId === node.name;
                    return (
                      <div
                        key={node.name}
                        onClick={() => dispatch({ type: 'SELECT', payload: node.name })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 8px', borderRadius: 4, cursor: 'pointer',
                          background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                          borderLeft: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                          fontSize: 11, fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          transition: 'all 0.1s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{def?.icon ?? '\u2B1C'}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {def?.label ?? node.type}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_COMPONENT', payload: node.name }); }}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13, padding: '0 2px', lineHeight: 1, opacity: 0.4 }}
                          title="Remove"
                        >{'\u00D7'}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionBlock>
          );
        })()}
      </div>
    </div>
  );
}
