import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { componentRegistry, type ComponentDef } from '../component-registry';
import { useEditor, LAYOUT_DEFS, type LayoutType, type EditorComponent } from '../state';

function LayoutThumbnail({ type, label, isActive, onClick }: {
  type: LayoutType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const columns: React.CSSProperties = (() => {
    switch (type) {
      case 'fullWidth':
        return { gridTemplateColumns: '1fr' };
      case 'twoColumn':
        return { gridTemplateColumns: '1fr 1fr' };
      case 'sidebar':
        return { gridTemplateColumns: '1fr 2.5fr' };
    }
  })();

  const regionCount = type === 'fullWidth' ? 1 : 2;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 8px',
        borderRadius: '8px',
        border: `2px solid ${isActive ? '#3b82f6' : '#e2e8f0'}`,
        background: isActive ? '#eff6ff' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flex: 1,
      }}
    >
      <div style={{ display: 'grid', ...columns, gap: '3px', width: '100%', height: '32px' }}>
        {Array.from({ length: regionCount }).map((_, i) => (
          <div
            key={i}
            style={{
              background: isActive ? '#bfdbfe' : '#e2e8f0',
              borderRadius: '3px',
              border: `1px solid ${isActive ? '#93c5fd' : '#cbd5e1'}`,
            }}
          />
        ))}
      </div>
      <div style={{
        fontSize: '10px',
        fontWeight: isActive ? 700 : 500,
        color: isActive ? '#1d4ed8' : '#64748b',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {label}
      </div>
    </button>
  );
}

function DraggablePaletteItem({ def }: { def: ComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${def.id}`,
    data: { type: def.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        background: isDragging ? '#eff6ff' : '#fff',
        cursor: 'grab',
        fontSize: '13px',
        fontWeight: 500,
        color: '#334155',
        transition: 'border-color 0.15s, background 0.15s',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>{def.icon}</span>
      <div>
        <div>{def.label}</div>
        <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>{def.description}</div>
      </div>
    </div>
  );
}

function TreeNode({ node, depth }: { node: EditorComponent; depth: number }) {
  const { state, dispatch } = useEditor();
  const isSelected = state.selectedId === node.name;
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.child && node.child.length > 0;

  return (
    <div>
      <div
        onClick={() => dispatch({ type: 'SELECT', payload: node.name })}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 8px',
          paddingLeft: `${8 + depth * 16}px`,
          borderRadius: '4px',
          background: isSelected ? '#eff6ff' : 'transparent',
          borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? '#1e40af' : '#475569',
          transition: 'all 0.1s',
        }}
      >
        {hasChildren && (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ cursor: 'pointer', fontSize: '10px', width: '14px', textAlign: 'center', color: '#94a3b8' }}
          >
            {expanded ? '\u25BC' : '\u25B6'}
          </span>
        )}
        {!hasChildren && <span style={{ width: '14px' }} />}
        <span style={{ fontSize: '13px' }}>{getIconForType(node.type)}</span>
        <span style={{ flex: 1 }}>{node.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_COMPONENT', payload: node.name }); }}
          style={{
            border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8',
            fontSize: '14px', padding: '0 2px', lineHeight: 1,
          }}
          title="Remove"
        >
          {'\u00D7'}
        </button>
      </div>
      {hasChildren && expanded && node.child!.map((child) => (
        <TreeNode key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function getIconForType(type: string): string {
  const def = componentRegistry.find((c) => c.id === type);
  return def?.icon ?? '\u2B1C';
}

export function Sidebar() {
  const { state, dispatch } = useEditor();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Layouts */}
      <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={sectionHeading}>Layouts</h3>
        <div style={{ display: 'flex', gap: '6px' }}>
          {LAYOUT_DEFS.map((def) => (
            <LayoutThumbnail
              key={def.type}
              type={def.type}
              label={def.label}
              isActive={state.layout === def.type}
              onClick={() => dispatch({ type: 'SET_LAYOUT', payload: def.type })}
            />
          ))}
        </div>

        {state.layout === 'sidebar' && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Split</label>
            <input
              type="range"
              min={15}
              max={50}
              step={5}
              value={state.splitRatio}
              onChange={(e) => dispatch({ type: 'SET_SPLIT', payload: Number(e.target.value) })}
              style={{ flex: 1, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', minWidth: '48px', textAlign: 'right' }}>
              {state.splitRatio} / {100 - state.splitRatio}
            </span>
          </div>
        )}
      </div>

      {/* Components */}
      <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={sectionHeading}>Components</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {componentRegistry.map((def) => (
            <DraggablePaletteItem key={def.id} def={def} />
          ))}
        </div>
      </div>

      {/* Config Tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 8px' }}>
        <h3 style={{ ...sectionHeading, paddingLeft: '6px' }}>Config Tree</h3>
        {state.tree.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            Select a layout and drag components to start
          </div>
        ) : (
          state.tree.map((node) => <TreeNode key={node.name} node={node} depth={0} />)
        )}
      </div>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94a3b8',
  marginBottom: '10px',
};
