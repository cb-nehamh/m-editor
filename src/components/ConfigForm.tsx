import React from 'react';
import { useEditor, findInRegions } from '../state';
import { registryMap, type ComponentDef, type OptionField } from '../component-registry';

export function ConfigForm() {
  const { state, dispatch } = useEditor();
  const selectedId = state.selectedId;

  if (!selectedId) {
    return (
      <div style={emptyContainer}>
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>&#9776;</div>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Select a component to configure</div>
      </div>
    );
  }

  const node = findInRegions(state.regionComponents, selectedId);
  if (!node) return null;

  const def = registryMap.get(node.type);
  if (!def) {
    return (
      <div style={panelContainer}>
        <h3 style={panelTitle}>{node.name}</h3>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>No schema for type "{node.type}"</p>
      </div>
    );
  }

  const option = node.option ?? {};

  const updateOption = (path: string, value: any) => {
    dispatch({ type: 'UPDATE_OPTION', payload: { id: selectedId, path, value } });
  };

  return (
    <div style={panelContainer}>
      <div style={headerSection}>
        <span style={{ fontSize: '20px' }}>{def.icon}</span>
        <div>
          <h3 style={panelTitle}>{def.label}</h3>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{node.name}</div>
        </div>
      </div>

      {/* Variant selector */}
      {def.variants && def.variants.length > 0 && (
        <FormSection label="Variant">
          <select
            value={option.variant ?? def.variants[0].value}
            onChange={(e) => updateOption('variant', e.target.value)}
            style={selectStyle}
          >
            {def.variants.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </FormSection>
      )}

      {/* Region (for child components inside layout) */}
      <FormSection label="Region">
        <input
          type="text"
          value={option.region ?? 'main'}
          onChange={(e) => updateOption('region', e.target.value)}
          style={inputStyle}
          placeholder="main, sidebar, content, left, right"
        />
      </FormSection>

      {/* Options */}
      {def.options.length > 0 && (
        <div>
          <div style={sectionLabel}>Options</div>
          {def.options.map((field) => (
            <OptionFieldInput
              key={field.key}
              field={field}
              value={option[field.key]}
              onChange={(val) => updateOption(field.key, val)}
            />
          ))}
        </div>
      )}

      {/* Features */}
      {def.features.length > 0 && (
        <div>
          <div style={sectionLabel}>Features</div>
          {def.features.map((feat) => {
            const checked = option.features?.[feat.key] ?? feat.default;
            return (
              <label key={feat.key} style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateOption(`features.${feat.key}`, e.target.checked)}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '13px', color: '#334155' }}>{feat.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Spacing */}
      <div>
        <div style={sectionLabel}>Spacing</div>
        <SpacingGroup
          label="Margin"
          prefix="spacing.margin"
          values={option.spacing?.margin ?? {}}
          onChange={updateOption}
        />
      </div>

      {/* Title */}
      <div>
        <div style={sectionLabel}>Title</div>
        <FormSection label="Title Text">
          <input
            type="text"
            value={option.titleText ?? def.label}
            onChange={(e) => updateOption('titleText', e.target.value)}
            style={inputStyle}
          />
        </FormSection>
        <StyleEditor
          label="Title Styling"
          styleKey="heading"
          styles={option.styles ?? {}}
          onChange={updateOption}
        />
      </div>

      {/* Element Styling */}
      {def.styleKeys.length > 0 && (
        <div>
          <div style={sectionLabel}>Element Styling</div>
          {def.styleKeys
            .filter((sk) => sk !== 'heading')
            .map((sk) => (
              <StyleEditor
                key={sk}
                label={camelToTitle(sk)}
                styleKey={sk}
                styles={option.styles ?? {}}
                onChange={updateOption}
              />
            ))}
        </div>
      )}

      {/* Danger zone */}
      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #fee2e2' }}>
        <button
          onClick={() => dispatch({ type: 'REMOVE_COMPONENT', payload: selectedId })}
          style={dangerBtn}
        >
          Remove Component
        </button>
      </div>
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function OptionFieldInput({
  field,
  value,
  onChange,
}: {
  field: OptionField;
  value: any;
  onChange: (val: any) => void;
}) {
  const effectiveValue = value ?? field.default;

  switch (field.type) {
    case 'string':
      return (
        <FormSection label={field.label}>
          <input
            type="text"
            value={effectiveValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
          />
        </FormSection>
      );

    case 'number':
      return (
        <FormSection label={field.label}>
          <input
            type="number"
            value={effectiveValue ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            style={inputStyle}
          />
        </FormSection>
      );

    case 'boolean':
      return (
        <label style={{ ...checkboxRow, marginBottom: '8px' }}>
          <input
            type="checkbox"
            checked={effectiveValue ?? false}
            onChange={(e) => onChange(e.target.checked)}
            style={{ accentColor: '#3b82f6' }}
          />
          <span style={{ fontSize: '13px', color: '#334155' }}>{field.label}</span>
        </label>
      );

    case 'select':
      return (
        <FormSection label={field.label}>
          <select
            value={effectiveValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={selectStyle}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormSection>
      );

    case 'multiselect': {
      const selected: string[] = Array.isArray(effectiveValue) ? effectiveValue : [];
      return (
        <FormSection label={field.label}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {field.options?.map((opt) => (
              <label key={opt.value} style={checkboxRow}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt.value]
                      : selected.filter((v) => v !== opt.value);
                    onChange(next);
                  }}
                  style={{ accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '12px', color: '#475569' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </FormSection>
      );
    }

    case 'json':
      return (
        <FormSection label={field.label}>
          <textarea
            value={typeof effectiveValue === 'string' ? effectiveValue : JSON.stringify(effectiveValue, null, 2)}
            onChange={(e) => {
              try { onChange(JSON.parse(e.target.value)); } catch { /* keep raw */ }
            }}
            style={{ ...inputStyle, minHeight: '60px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
          />
        </FormSection>
      );

    default:
      return null;
  }
}

function camelToTitle(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function StyleEditor({ label, styleKey, styles, onChange }: {
  label: string;
  styleKey: string;
  styles: Record<string, any>;
  onChange: (path: string, value: any) => void;
}) {
  const current = styles[styleKey] ?? {};
  const [open, setOpen] = React.useState(false);
  const hasValues = current.color || current.fontSize;

  return (
    <div style={{ marginBottom: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#334155',
          background: '#f8fafc',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {hasValues && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: current.color || '#3b82f6' }} />}
          {label}
        </span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 10px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Color</div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <input
                type="color"
                value={current.color || '#1e293b'}
                onChange={(e) => onChange(`styles.${styleKey}.color`, e.target.value)}
                style={{ width: '28px', height: '28px', border: '1px solid #d1d5db', borderRadius: '4px', padding: 0, cursor: 'pointer' }}
              />
              <input
                type="text"
                value={current.color || ''}
                onChange={(e) => onChange(`styles.${styleKey}.color`, e.target.value)}
                placeholder="#1e293b"
                style={{ flex: 1, padding: '4px 6px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none', color: '#1e293b', fontFamily: 'monospace' }}
              />
            </div>
          </div>
          <div style={{ width: '70px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '3px' }}>Size (px)</div>
            <input
              type="number"
              min={8}
              max={72}
              value={current.fontSize || ''}
              onChange={(e) => onChange(`styles.${styleKey}.fontSize`, e.target.value ? Number(e.target.value) : '')}
              placeholder="14"
              style={{ width: '100%', padding: '4px 6px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '4px', outline: 'none', color: '#1e293b', textAlign: 'center' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SpacingGroup({ label, prefix, values, onChange }: {
  label: string;
  prefix: string;
  values: Record<string, number>;
  onChange: (path: string, value: any) => void;
}) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>{label} (px)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px' }}>
        {sides.map((side) => {
          const key = side.toLowerCase();
          return (
            <div key={side} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <input
                type="number"
                min={0}
                value={values[key] ?? 0}
                onChange={(e) => onChange(`${prefix}.${key}`, Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '4px 4px',
                  fontSize: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  outline: 'none',
                  textAlign: 'center',
                  color: '#1e293b',
                }}
              />
              <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{side[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const emptyContainer: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '24px',
};

const panelContainer: React.CSSProperties = {
  padding: '16px',
};

const headerSection: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px',
  paddingBottom: '14px',
  borderBottom: '1px solid #e2e8f0',
};

const panelTitle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#1e293b',
  margin: 0,
};

const sectionLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#94a3b8',
  marginTop: '16px',
  marginBottom: '8px',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: '13px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  color: '#1e293b',
  background: '#fff',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
};

const checkboxRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '3px 0',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#dc2626',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '6px',
  cursor: 'pointer',
};
