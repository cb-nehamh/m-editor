import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, LAYOUT_DEFS, type EditorComponent, type LayoutSection } from '../state';
import { registryMap } from '../component-registry';
import { useTheme } from '../commons/ThemeContext';
import { applyDarkModeToShadow, getShadowRoot } from '../commons/dark-mode-shadow-css';

function RegionDropZone({ region, regionLabel, sectionId, children }: {
  region: string;
  regionLabel: string;
  sectionId: string;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-region-${sectionId}-${region}`,
    data: { parentId: null, region, sectionId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`drop-zone no-pan${isOver ? ' over' : ''}`}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <div className="drop-zone-label">{regionLabel}</div>
      <div style={{ flex: 1, padding: 0 }}>
        {children}
        <AnimatePresence>
          {isOver && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: 14, textAlign: 'center', fontSize: 12,
                color: 'var(--color-primary)', fontWeight: 600,
              }}
            >
              Drop component here
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function resolveEditorStyles(editorStyles: Record<string, any> | undefined): Record<string, React.CSSProperties> | undefined {
  if (!editorStyles) return undefined;
  const resolved: Record<string, React.CSSProperties> = {};
  for (const [key, val] of Object.entries(editorStyles)) {
    if (!val || typeof val !== 'object') continue;
    const style: Record<string, any> = {};
    for (const [prop, v] of Object.entries(val)) {
      if (v === '' || v === undefined || v === null) continue;
      if (prop === 'fontSize' && typeof v === 'number') {
        style[prop] = `${v}px`;
      } else {
        style[prop] = v;
      }
    }
    if (Object.keys(style).length > 0) resolved[key] = style as React.CSSProperties;
  }
  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function LiveWidget({ node, sectionId, region }: { node: EditorComponent; sectionId: string; region: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef<string | null>(null);
  const { dispatch, state } = useEditor();
  const { theme } = useTheme();
  const isSelected = state.selectedId === node.name;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortTransition,
    isDragging,
  } = useSortable({
    id: node.name,
    data: { sectionId, region, componentName: node.name },
  });

  const mountOptionKey = useMemo(() => {
    const { spacing, titleText, descriptionText, ...rest } = (node.option ?? {}) as any;
    return JSON.stringify({ name: node.name, type: node.type, ...rest });
  }, [node.name, node.type, node.option]);

  useEffect(() => {
    const mjs = (window as any).MJS;
    if (!mjs || !hostRef.current) return;

    if (mountedRef.current) {
      mjs.unmount(mountedRef.current);
      mountedRef.current = null;
    }

    const hostId = `preview-host-${node.name}`;
    hostRef.current.id = hostId;

    const widgetStyles = resolveEditorStyles(node.option?.styles);
    const config = {
      name: node.name,
      type: node.type,
      option: {
        ...node.option,
        ...(widgetStyles ? { styles: widgetStyles } : {}),
        _configuredMode: node.option?.mode,
        mode: 'editor',
      },
    };

    try {
      mjs.mount(node.type, `#${hostId}`, config);
      mountedRef.current = node.name;
    } catch (err) {
      console.error(`Failed to mount ${node.type}:`, err);
    }

    return () => {
      if (mountedRef.current) {
        try { mjs.unmount(mountedRef.current); } catch { /* ignore */ }
        mountedRef.current = null;
      }
    };
  }, [mountOptionKey]);

  useEffect(() => {
    if (!mountedRef.current || !node.name) return;
    const mjs = (window as any).MJS;
    if (!mjs?.updateConfig) return;
    const hostId = `preview-host-${node.name}`;
    const widgetStyles = resolveEditorStyles(node.option?.styles);
    const config = {
      name: node.name,
      type: node.type,
      option: {
        ...node.option,
        ...(widgetStyles ? { styles: widgetStyles } : {}),
        _configuredMode: node.option?.mode,
        mode: 'editor',
      },
    };
    mjs.updateConfig(node.name, config);
  }, [node.option?.titleText, node.option?.descriptionText, node.option?.styles, node.name, node.type, node.option]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const apply = () => {
      const sr = getShadowRoot(hostRef.current);
      applyDarkModeToShadow(sr, theme === 'dark');
    };
    apply();
    const id = requestAnimationFrame(() => apply());
    return () => cancelAnimationFrame(id);
  }, [theme, mountOptionKey]);

  const def = registryMap.get(node.type);
  const margin = node.option?.spacing?.margin ?? {};
  const containerStyle: React.CSSProperties = {
    marginTop: margin.top ? `${margin.top}px` : undefined,
    marginRight: margin.right ? `${margin.right}px` : undefined,
    marginBottom: margin.bottom ? `${margin.bottom}px` : '8px',
    marginLeft: margin.left ? `${margin.left}px` : undefined,
    width: '100%',
    minWidth: 0,
    transition: sortTransition ?? 'margin 0.2s ease',
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT', payload: node.name }); }}
      className={`widget-card no-pan${isSelected ? ' selected' : ''}`}
      style={containerStyle}
    >
      <div className="drag-handle no-pan" title="Drag to reorder" {...attributes} {...listeners}>&#x2630;</div>

      <button
        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_COMPONENT', payload: node.name }); }}
        style={{
          position: 'absolute', top: 6, right: 6, zIndex: 5,
          width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface)', cursor: 'pointer',
          color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity var(--transition-fast)',
        }}
        title="Remove"
      >{'\u00D7'}</button>

      <div ref={hostRef} className="mjs-widget-host" style={{ minHeight: 60, padding: '0 8px 8px', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }} />

      {node.option?.defaultVisible === false && (
        <div style={{
          padding: '6px 12px', margin: '0 8px 8px',
          background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)',
          borderRadius: 6, fontSize: 11, color: 'var(--color-warning)',
        }}>
          Hidden by default &mdash; will show when it receives a visibility message
        </div>
      )}
    </div>
  );
}

const regionLabels: Record<string, string> = {
  main: 'MAIN', left: 'LEFT', right: 'RIGHT', sidebar: 'SIDEBAR', content: 'CONTENT',
};

function SectionPreview({ section, index }: { section: LayoutSection; index: number }) {
  const { state, dispatch } = useEditor();
  const isActive = state.activeSectionId === section.id;
  const layoutDef = LAYOUT_DEFS.find((l) => l.type === section.layout)!;
  const totalComponents = Object.values(section.regionComponents).flat().length;

  const gridColumns = (() => {
    switch (section.layout) {
      case 'fullWidth': return '1fr';
      case 'twoColumn': return '1fr 1fr';
      case 'sidebar': return `${section.splitRatio}fr ${100 - section.splitRatio}fr`;
    }
  })();

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={() => dispatch({ type: 'SELECT_SECTION', payload: section.id })}
      className={`section-card no-pan${isActive ? ' active' : ''}`}
    >
      <div className="section-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface-alt)',
            padding: '3px 10px', borderRadius: 6,
            transition: 'all var(--transition-fast)',
          }}>
            Section {index + 1}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {layoutDef.label} &middot; {totalComponents} component{totalComponents !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {index > 0 && (
            <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REORDER_SECTIONS', payload: { fromIndex: index, toIndex: index - 1 } }); }}
              className="btn btn-ghost btn-sm" title="Move up">&#x25B2;</button>
          )}
          {index < state.sections.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REORDER_SECTIONS', payload: { fromIndex: index, toIndex: index + 1 } }); }}
              className="btn btn-ghost btn-sm" title="Move down">&#x25BC;</button>
          )}
          {state.sections.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_SECTION', payload: section.id }); }}
              className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}
              title="Remove section">&#x00D7;</button>
          )}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: gridColumns,
          gap: 12, minHeight: 100,
          overflow: 'hidden',
        }}>
          {layoutDef.regions.map((region) => {
            const comps = section.regionComponents[region] ?? [];
            const sortableIds = comps.map((c) => c.name);
            return (
              <RegionDropZone key={region} region={region} sectionId={section.id}
                regionLabel={regionLabels[region] ?? region.toUpperCase()}>
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  {comps.length > 0 ? (
                    <div style={{ padding: 8 }}>
                      {comps.map((node) => (
                        <LiveWidget key={node.name} node={node} sectionId={section.id} region={region} />
                      ))}
                    </div>
                  ) : undefined}
                </SortableContext>
              </RegionDropZone>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function CollapsibleJsonViewer() {
  const { state } = useEditor();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const jsonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = jsonContainerRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => { e.stopPropagation(); };
    el.addEventListener('wheel', stopWheel, { passive: false });
    return () => el.removeEventListener('wheel', stopWheel);
  });

  const configPayload = useMemo(
    () => JSON.stringify({ sections: state.sections, containerWidth: state.containerWidth }, null, 2),
    [state.sections, state.containerWidth],
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(configPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <button
        className="no-pan"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 16px', fontSize: 12, fontWeight: 600,
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--color-border)', borderRadius: 8,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: 10 }}>&#x25B6;</span>
        Config JSON
        <span style={{
          fontSize: 9, fontWeight: 700, background: 'var(--color-primary-light)',
          color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 10,
          marginLeft: 'auto',
        }}>{configPayload.length} chars</span>
      </button>
      {open && (
        <div
          ref={jsonContainerRef}
          className="no-pan"
          style={{
            marginTop: 4, border: '1px solid var(--color-border)', borderRadius: 8,
            background: '#1e293b', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', maxHeight: 480,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '6px 10px', borderBottom: '1px solid #334155', flexShrink: 0 }}>
            {copied && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>Copied!</span>}
            <button
              className="no-pan"
              onClick={handleCopy}
              style={{
                fontSize: 10, fontWeight: 600, padding: '3px 10px',
                background: copied ? '#166534' : '#334155',
                color: copied ? '#bbf7d0' : '#94a3b8',
                border: 'none', borderRadius: 4, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{copied ? 'Copied!' : 'Copy'}</button>
          </div>
          <pre style={{
            margin: 0, padding: '12px 16px', fontSize: 13,
            lineHeight: 1.5, color: '#e2e8f0', fontFamily: "'SF Mono', Menlo, Consolas, monospace",
            overflowX: 'auto', overflowY: 'auto', flex: 1,
            whiteSpace: 'pre', tabSize: 2,
          }}>{configPayload}</pre>
        </div>
      )}
    </div>
  );
}

export function Preview() {
  const { state, dispatch } = useEditor();
  const totalComponents = state.sections.reduce(
    (sum, s) => sum + Object.values(s.regionComponents).flat().length, 0
  );

  return (
    <div>
      <div className="demo-banner">
        <span style={{ fontSize: 14 }}>&#x26A0;</span>
        <span><strong>Demo data</strong> &mdash; components display sample data in the editor. Use <strong>Preview</strong> to see real customer data.</span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, letterSpacing: '-0.02em' }}>
            EL-UI Builder
          </h3>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {state.sections.length} section{state.sections.length !== 1 ? 's' : ''} &middot; {totalComponents} component{totalComponents !== 1 ? 's' : ''}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => dispatch({ type: 'ADD_SECTION' })}
          className="btn btn-primary"
        >
          + Add Section
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <AnimatePresence>
          {state.sections.map((section, index) => (
            <SectionPreview key={section.id} section={section} index={index} />
          ))}
        </AnimatePresence>
      </div>

      <CollapsibleJsonViewer />
    </div>
  );
}
