import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useSearchParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorProvider, useEditor, type SavedEditorConfig } from './state';
import { Sidebar } from './components/Sidebar';
import { ConfigForm } from './components/ConfigForm';
import { Preview } from './components/Preview';
import { registryMap } from './component-registry';
import { saveConfig, fetchConfig } from './api';

const DEFAULT_DOMAIN = 'yash-pc2-test';

function ZoomControls({ scale }: { scale: number }) {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const pct = Math.round(scale * 100);

  return (
    <div className="floating-zoom-bar">
      <button className="zoom-btn" onClick={() => zoomOut(0.2)} title="Zoom out">-</button>
      <button
        className="zoom-btn"
        onClick={() => resetTransform()}
        title="Reset zoom"
        style={{ minWidth: '52px', fontSize: '11px', fontWeight: 700 }}
      >
        {pct}%
      </button>
      <button className="zoom-btn" onClick={() => zoomIn(0.2)} title="Zoom in">+</button>
      <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,0.08)', margin: '0 2px' }} />
      <button className="zoom-btn" onClick={() => resetTransform()} title="Fit to view" style={{ fontSize: '12px' }}>
        &#x2922;
      </button>
    </div>
  );
}

function EditorShell() {
  const { state, dispatch } = useEditor();
  const [draggedType, setDraggedType] = React.useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configStatus, setConfigStatus] = useState<'draft' | 'published'>('draft');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const canvasWrapperRef = useRef<any>(null);
  const [canvasScale, setCanvasScale] = useState(0.85);

  const [searchParams, setSearchParams] = useSearchParams();
  const domain = searchParams.get('domain') || DEFAULT_DOMAIN;
  const configId = searchParams.get('id') || '';

  useEffect(() => {
    if (!configId) return;
    fetchConfig(domain, configId)
      .then((res) => {
        if (res) {
          setConfigStatus((res.status as 'draft' | 'published') || 'draft');
          const config = res.config as any;
          const inner = Array.isArray(config) ? config[0] : config;
          if (inner?.sections) {
            dispatch({ type: 'LOAD_FULL', payload: { sections: inner.sections } });
          } else if (Array.isArray(config)) {
            dispatch({ type: 'LOAD_CONFIG', payload: config });
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load config:', err);
        showToast('Failed to load config');
      });
  }, [domain, configId]);

  useEffect(() => {
    if (state.selectedId && !rightOpen) setRightOpen(true);
  }, [state.selectedId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); setLeftOpen((v) => !v); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setRightOpen((v) => !v); }
      if (e.key === 'Escape') { dispatch({ type: 'SELECT', payload: null }); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dispatch]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    const type = e.active.data.current?.type as string | undefined;
    if (type) setDraggedType(type);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDraggedType(null);
      if (!e.over) return;

      const activeData = e.active.data.current ?? {};
      const overData = e.over.data.current ?? {};

      const isReorder = !!activeData.componentName;
      if (isReorder) {
        const activeName = activeData.componentName as string;
        const fromSection = activeData.sectionId as string;
        const fromRegion = activeData.region as string;

        const toSection = (overData.sectionId as string) ?? fromSection;
        const toRegion = (overData.region as string) ?? fromRegion;

        if (fromSection === toSection && fromRegion === toRegion) {
          const section = state.sections.find((s) => s.id === fromSection);
          if (!section) return;
          const comps = section.regionComponents[fromRegion] ?? [];
          const fromIndex = comps.findIndex((c) => c.name === activeName);
          const overName = (e.over!.data.current as any)?.componentName ?? e.over!.id;
          const toIndex = comps.findIndex((c) => c.name === overName);
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

          dispatch({
            type: 'REORDER_WITHIN_REGION',
            payload: { sectionId: fromSection, region: fromRegion, fromIndex, toIndex },
          });
        } else {
          const targetSection = state.sections.find((s) => s.id === toSection);
          if (!targetSection) return;
          const targetComps = targetSection.regionComponents[toRegion] ?? [];
          const overName = (e.over!.data.current as any)?.componentName;
          const toIndex = overName
            ? targetComps.findIndex((c) => c.name === overName)
            : targetComps.length;

          dispatch({
            type: 'MOVE_BETWEEN_REGIONS',
            payload: { componentId: activeName, toSectionId: toSection, toRegion, toIndex: Math.max(0, toIndex) },
          });
        }
        return;
      }

      const type = activeData.type as string | undefined;
      if (!type) return;
      const def = registryMap.get(type);
      if (!def) return;

      const region = (overData.region as string) ?? 'main';
      const sectionId = overData.sectionId as string | undefined;

      const id = `${type}-${Date.now()}`;
      const defaultVariant = def.variants?.[0]?.value;

      const option: Record<string, any> = { region };
      if (defaultVariant) option.variant = defaultVariant;

      def.features.forEach((f) => {
        if (!option.features) option.features = {};
        option.features[f.key] = f.default;
      });

      def.options.forEach((o) => {
        if (o.default !== undefined) option[o.key] = o.default;
      });

      dispatch({
        type: 'ADD_COMPONENT',
        payload: { parentId: null, region, sectionId, component: { name: id, type, option } },
      });

      if (sectionId) dispatch({ type: 'SELECT_SECTION', payload: sectionId });
      dispatch({ type: 'SELECT', payload: id });
    },
    [dispatch, state.sections]
  );

  async function handleSave(status: 'draft' | 'published') {
    const id = configId || crypto.randomUUID();

    setSaving(true);
    try {
      const configPayload = { sections: state.sections };
      await saveConfig(domain, id, [configPayload] as any, status);
      setConfigStatus(status);
      if (!configId) {
        setSearchParams({ domain, id });
      }
      showToast(status === 'published' ? 'Published!' : 'Draft saved!');
    } catch (err) {
      console.error('Save failed:', err);
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function handlePreview() {
    sessionStorage.setItem('mjs-preview-config', JSON.stringify(state.tree));
    const params = new URLSearchParams({ domain });
    if (configId) params.set('id', configId);
    window.open(`/preview?${params.toString()}`, '_blank');
  }

  const draggedDef = draggedType ? registryMap.get(draggedType) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* ===== INFINITE CANVAS ===== */}
        <TransformWrapper
          ref={canvasWrapperRef}
          initialScale={0.85}
          minScale={0.2}
          maxScale={2.5}
          centerOnInit={false}
          initialPositionX={-450}
          initialPositionY={-40}
          wheel={{ step: 0.08 }}
          panning={{ velocityDisabled: true, excluded: ['input', 'textarea', 'select', 'button', 'no-pan'] }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
          onTransformed={(_ref, state) => setCanvasScale(state.scale)}
        >
          <div className="canvas-viewport">
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ minWidth: '3000px', minHeight: '3000px', position: 'relative' }}
            >
              <div className="canvas-dot-grid" />
              <div style={{
                position: 'relative',
                width: `${state.containerWidth}px`,
                margin: '80px auto 400px',
                padding: '40px',
              }}>
                <Preview />
              </div>
            </TransformComponent>
          </div>
          <ZoomControls scale={canvasScale} />
        </TransformWrapper>

        {/* ===== FLOATING TOP TOOLBAR ===== */}
        <motion.div
          className="floating-toolbar-top"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
          
        >
          <div style={{
            width: 20, height: 20,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>M</div>

          <span className={`badge ${configStatus === 'published' ? 'badge-published' : 'badge-draft'}`}>
            {configStatus}
          </span>

          <div className="toolbar-divider" />

          <button className="btn-toolbar" onClick={() => setLeftOpen((v) => !v)} title="Toggle palette (L)">
            {leftOpen ? '\u25E7' : '\u25A6'}
          </button>
          <button className="btn-toolbar" onClick={() => setRightOpen((v) => !v)} title="Toggle inspector (R)">
            {rightOpen ? '\u25E8' : '\u25A7'}
          </button>

          <div className="toolbar-divider" />

          <button className="btn-toolbar" onClick={() => dispatch({ type: 'ADD_SECTION' })}>
            + Section
          </button>

          <div className="toolbar-divider" />

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[960, 1100, 1280, 1440].map((w) => (
              <button
                key={w}
                className="btn-toolbar"
                onClick={() => dispatch({ type: 'SET_CONTAINER_WIDTH', payload: w })}
                style={{
                  fontSize: 10, padding: '3px 5px', minWidth: 0,
                  ...(state.containerWidth === w ? { background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontWeight: 700 } : {}),
                }}
                title={`Set canvas width to ${w}px`}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          <button
            className="btn-toolbar"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button
            className="btn-toolbar btn-toolbar-success"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {saving ? '...' : 'Publish'}
          </button>
          <button className="btn-toolbar btn-toolbar-accent" onClick={handlePreview}>
            Preview &#x2197;
          </button>
        </motion.div>

        {/* ===== FLOATING LEFT PANEL (Sidebar) ===== */}
        <AnimatePresence>
          {leftOpen && (
            <motion.div
              className="floating-panel"
              style={{
                position: 'fixed',
                left: 16,
                top: 72,
                bottom: 72,
                width: 272,
              }}
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>

        {!leftOpen && (
          <button
            className="panel-toggle panel-toggle-left"
            onClick={() => setLeftOpen(true)}
            title="Show palette (L)"
          >
            &#x25B6;
          </button>
        )}

        {/* ===== FLOATING RIGHT PANEL (Config) ===== */}
        <AnimatePresence>
          {rightOpen && (
            <motion.div
              className="floating-panel"
              style={{
                position: 'fixed',
                right: 16,
                top: 72,
                bottom: 72,
                width: 320,
              }}
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <ConfigForm onClose={() => setRightOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {!rightOpen && (
          <button
            className="panel-toggle panel-toggle-right"
            onClick={() => setRightOpen(true)}
            title="Show inspector (R)"
          >
            &#x25C0;
          </button>
        )}

        {/* ===== TOAST ===== */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              key="toast"
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                background: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                zIndex: 1000,
              }}
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DragOverlay>
        {draggedDef ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.05, opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#fff',
              border: '2px solid var(--color-primary, #3b82f6)',
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
              fontSize: 13,
              fontWeight: 600,
              color: '#1e293b',
            }}
          >
            <span>{draggedDef.icon}</span>
            <span>{draggedDef.label}</span>
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export function App() {
  return (
    <EditorProvider>
      <EditorShell />
    </EditorProvider>
  );
}
