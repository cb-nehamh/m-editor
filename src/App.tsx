import React, { useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { EditorProvider, useEditor, type SavedEditorConfig } from './state';
import { Sidebar } from './components/Sidebar';
import { ConfigForm } from './components/ConfigForm';
import { Preview } from './components/Preview';
import { registryMap } from './component-registry';

function EditorShell() {
  const { state, dispatch } = useEditor();
  const [draggedType, setDraggedType] = React.useState<string | null>(null);

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
      const type = e.active.data.current?.type as string | undefined;
      if (!type || !e.over) return;

      const def = registryMap.get(type);
      if (!def) return;

      const region = (e.over.data.current?.region as string) ?? 'main';

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
        payload: {
          parentId: null,
          region,
          component: { name: id, type, option },
        },
      });

      dispatch({ type: 'SELECT', payload: id });
    },
    [dispatch]
  );

  const draggedDef = draggedType ? registryMap.get(draggedType) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={styles.root}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>MJS Portal Editor</h1>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.secondaryBtn} onClick={() => loadFromStorage(dispatch)}>
              Load
            </button>
            <button style={styles.secondaryBtn} onClick={() => exportJSON(state)}>
              Export JSON
            </button>
            <label style={styles.secondaryBtn}>
              Import
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={(e) => importJSON(e, dispatch)} />
            </label>
            <button style={styles.primaryBtn} onClick={() => saveToStorage(state)}>
              Save
            </button>
          </div>
        </header>

        {/* Three-panel body */}
        <div style={styles.body}>
          <div style={styles.leftPanel}>
            <Sidebar />
          </div>
          <div style={styles.centerPanel}>
            <Preview />
          </div>
          <div style={styles.rightPanel}>
            <ConfigForm />
          </div>
        </div>
      </div>

      <DragOverlay>
        {draggedDef ? (
          <div style={styles.dragOverlay}>
            <span>{draggedDef.icon}</span>
            <span>{draggedDef.label}</span>
          </div>
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

function buildSavedConfig(state: { layout: string; splitRatio: number; regionComponents: Record<string, any[]> }): SavedEditorConfig {
  return {
    layout: state.layout as SavedEditorConfig['layout'],
    splitRatio: state.splitRatio,
    regionComponents: state.regionComponents,
  };
}

function saveToStorage(state: { layout: string; splitRatio: number; regionComponents: Record<string, any[]> }) {
  localStorage.setItem('mjs-editor-config', JSON.stringify(buildSavedConfig(state)));
  alert('Configuration saved!');
}

function loadFromStorage(dispatch: any): void {
  const raw = localStorage.getItem('mjs-editor-config');
  if (!raw) {
    alert('No saved configuration found.');
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed.regionComponents) {
      dispatch({ type: 'LOAD_FULL', payload: {
        layout: parsed.layout ?? 'fullWidth',
        splitRatio: parsed.splitRatio ?? 25,
        regionComponents: parsed.regionComponents,
      }});
    } else if (parsed.tree) {
      dispatch({ type: 'LOAD_CONFIG', payload: parsed.tree });
    }
  } catch {
    alert('Invalid saved configuration.');
  }
}

function exportJSON(state: { layout: string; splitRatio: number; regionComponents: Record<string, any[]> }) {
  const config = buildSavedConfig(state);
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portal-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(e: React.ChangeEvent<HTMLInputElement>, dispatch: any) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string);
      if (parsed.regionComponents) {
        dispatch({ type: 'LOAD_FULL', payload: {
          layout: parsed.layout ?? 'fullWidth',
          splitRatio: parsed.splitRatio ?? 25,
          regionComponents: parsed.regionComponents,
        }});
      } else if (Array.isArray(parsed)) {
        dispatch({ type: 'LOAD_CONFIG', payload: parsed });
      }
    } catch {
      alert('Invalid JSON file.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    background: '#f1f5f9',
    color: '#1e293b',
    margin: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: '52px',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    color: '#fff',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  primaryBtn: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 500,
    background: 'rgba(255,255,255,0.1)',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  body: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 320px',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    background: '#fff',
    borderRight: '1px solid #e2e8f0',
    overflowY: 'auto' as const,
  },
  centerPanel: {
    background: '#f8fafc',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '20px',
    minHeight: 0,
  },
  rightPanel: {
    background: '#fff',
    borderLeft: '1px solid #e2e8f0',
    overflowY: 'auto' as const,
  },
  dragOverlay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: '#fff',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    fontSize: '13px',
    fontWeight: 600,
    color: '#1e293b',
  },
};
