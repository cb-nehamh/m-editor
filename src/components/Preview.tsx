import React, { useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useEditor, LAYOUT_DEFS, type EditorComponent } from '../state';
import { registryMap } from '../component-registry';

function RegionDropZone({ region, regionLabel, children }: {
  region: string;
  regionLabel: string;
  children?: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-region-${region}`,
    data: { parentId: null, region },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: '200px',
        border: `2px dashed ${isOver ? '#3b82f6' : '#d1d5db'}`,
        borderRadius: '10px',
        background: isOver ? '#eff6ff' : '#fff',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        padding: '8px 14px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        color: '#64748b',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        borderRadius: '10px 10px 0 0',
      }}>
        {regionLabel}
      </div>
      <div style={{ flex: 1, padding: '0' }}>
        {children}
        {isOver && (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#3b82f6',
            fontWeight: 600,
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function resolveEditorStyles(editorStyles: Record<string, any> | undefined): Record<string, React.CSSProperties> | undefined {
  if (!editorStyles) return undefined;
  const resolved: Record<string, React.CSSProperties> = {};
  for (const [key, val] of Object.entries(editorStyles)) {
    if (!val || typeof val !== 'object') continue;
    const style: React.CSSProperties = {};
    if (val.color) style.color = val.color;
    if (val.fontSize) style.fontSize = `${val.fontSize}px`;
    if (Object.keys(style).length > 0) resolved[key] = style;
  }
  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

function LiveWidget({ node }: { node: EditorComponent }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef<string | null>(null);
  const { dispatch, state } = useEditor();
  const isSelected = state.selectedId === node.name;

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
        try {
          mjs.unmount(mountedRef.current);
        } catch { /* ignore */ }
        mountedRef.current = null;
      }
    };
  }, [node.name, node.type, JSON.stringify(node.option)]);

  const def = registryMap.get(node.type);
  const margin = node.option?.spacing?.margin ?? {};
  const spacingStyle: React.CSSProperties = {
    marginTop: margin.top ? `${margin.top}px` : undefined,
    marginRight: margin.right ? `${margin.right}px` : undefined,
    marginBottom: margin.bottom ? `${margin.bottom}px` : '8px',
    marginLeft: margin.left ? `${margin.left}px` : undefined,
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT', payload: node.name }); }}
      style={{
        border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
        background: '#fff',
        ...spacingStyle,
      }}
    >
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_COMPONENT', payload: node.name }); }}
        style={{
          position: 'absolute', top: '6px', right: '6px', zIndex: 1,
          width: '22px', height: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #e2e8f0', borderRadius: '4px',
          background: '#fff', cursor: 'pointer',
          color: '#94a3b8', fontSize: '14px', lineHeight: 1,
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
        title="Remove"
      >
        {'\u00D7'}
      </button>

      {/* Component title */}
      {(() => {
        const titleText = node.option?.titleText ?? def?.label ?? node.type;
        const headingStyle = node.option?.styles?.heading ?? {};
        const resolvedHeadingStyle: React.CSSProperties = {
          fontSize: headingStyle.fontSize ? `${headingStyle.fontSize}px` : '16px',
          fontWeight: 700,
          color: headingStyle.color || '#1e293b',
          margin: 0,
          padding: '12px 16px 4px',
        };
        return <h3 style={resolvedHeadingStyle}>{titleText}</h3>;
      })()}

      {/* Actual MJS widget host */}
      <div
        ref={hostRef}
        style={{ minHeight: '60px' }}
      />
    </div>
  );
}

export function Preview() {
  const { state } = useEditor();
  const layoutDef = LAYOUT_DEFS.find((l) => l.type === state.layout)!;

  const gridColumns = (() => {
    switch (state.layout) {
      case 'fullWidth': return '1fr';
      case 'twoColumn': return '1fr 1fr';
      case 'sidebar': return `${state.splitRatio}fr ${100 - state.splitRatio}fr`;
    }
  })();

  const regionLabels: Record<string, string> = {
    main: 'MAIN',
    left: 'LEFT',
    right: 'RIGHT',
    sidebar: 'SIDEBAR',
    content: 'CONTENT',
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{
            fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0,
          }}>
            Page Builder
          </h3>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Layout: {layoutDef.label}
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          {Object.values(state.regionComponents).flat().length} component(s)
        </div>
      </div>

      {/* Layout regions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: '12px',
        minHeight: '400px',
      }}>
        {layoutDef.regions.map((region) => {
          const comps = state.regionComponents[region] ?? [];
          return (
            <RegionDropZone
              key={region}
              region={region}
              regionLabel={regionLabels[region] ?? region.toUpperCase()}
            >
              {comps.length > 0 ? (
                <div style={{ padding: '8px' }}>
                  {comps.map((node) => (
                    <LiveWidget key={node.name} node={node} />
                  ))}
                </div>
              ) : undefined}
            </RegionDropZone>
          );
        })}
      </div>

      {/* JSON Preview */}
      {state.tree.length > 0 && (
        <details style={{ marginTop: '20px' }}>
          <summary style={{
            fontSize: '12px', fontWeight: 600, color: '#64748b', cursor: 'pointer',
            padding: '8px 0',
          }}>
            View Config JSON
          </summary>
          <pre style={{
            background: '#1e293b', color: '#e2e8f0', padding: '14px',
            borderRadius: '8px', fontSize: '11px', overflow: 'auto',
            maxHeight: '300px', lineHeight: 1.5,
          }}>
            {JSON.stringify(state.tree, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
