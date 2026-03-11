import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, findInAllSections } from '../state';
import { registryMap, type OptionField } from '../component-registry';

export function ConfigForm({ onClose }: { onClose?: () => void }) {
  const { state, dispatch } = useEditor();
  const selectedId = state.selectedId;

  if (!selectedId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="floating-panel-header">
          <h3>Inspector</h3>
          {onClose && (
            <button onClick={onClose} style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1, padding: 2,
            }}>{'\u00D7'}</button>
          )}
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', flex: 1, padding: 24,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--color-surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 10, color: 'var(--color-text-muted)',
          }}>&#9776;</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Select a component to configure
          </div>
        </div>
      </div>
    );
  }

  const node = findInAllSections(state.sections, selectedId);
  if (!node) return null;

  const def = registryMap.get(node.type);
  if (!def) {
    return (
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{node.name}</h3>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>No schema for type &ldquo;{node.type}&rdquo;</p>
      </div>
    );
  }

  const option = node.option ?? {};

  const updateOption = (path: string, value: any) => {
    dispatch({ type: 'UPDATE_OPTION', payload: { id: selectedId, path, value } });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="floating-panel-header">
        <h3>Inspector</h3>
        {onClose && (
          <button onClick={onClose} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1, padding: 2,
          }}>{'\u00D7'}</button>
        )}
      </div>

      <div className="floating-panel-body" style={{ flex: 1, padding: 14 }}>
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, paddingBottom: 14,
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={{
              fontSize: 20, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-primary-light)',
              borderRadius: 8,
            }}>{def.icon}</span>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{def.label}</h3>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{node.name}</div>
            </div>
          </div>

          {/* Variant */}
          {def.variants && def.variants.length > 0 && (
            <FormSection label="Variant">
              <select
                value={option.variant ?? def.variants[0].value}
                onChange={(e) => updateOption('variant', e.target.value)}
                className="select"
                style={{ fontSize: 12 }}
              >
                {def.variants.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </FormSection>
          )}

          {/* Region */}
          <FormSection label="Region">
            <input
              type="text"
              value={option.region ?? 'main'}
              onChange={(e) => updateOption('region', e.target.value)}
              className="input"
              style={{ fontSize: 12 }}
              placeholder="main, sidebar, content, left, right"
            />
          </FormSection>

          {/* Options */}
          {def.options.length > 0 && (
            <div>
              <SectionLabel>Options</SectionLabel>
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
              <SectionLabel>Features</SectionLabel>
              {def.features.map((feat) => {
                const checked = option.features?.[feat.key] ?? feat.default;
                return (
                  <label key={feat.key} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 0', cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{feat.label}</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => updateOption(`features.${feat.key}`, e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </label>
                );
              })}
            </div>
          )}

          {/* Spacing */}
          <div>
            <SectionLabel>Spacing</SectionLabel>
            <SpacingGroup
              label="Margin"
              prefix="spacing.margin"
              values={option.spacing?.margin ?? {}}
              onChange={updateOption}
            />
          </div>

          {/* Title */}
          <div>
            <SectionLabel>Title</SectionLabel>
            <FormSection label="Title Text">
              <input
                type="text"
                value={option.titleText ?? def.label}
                onChange={(e) => updateOption('titleText', e.target.value)}
                className="input"
                style={{ fontSize: 12 }}
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
              <SectionLabel>Element Styling</SectionLabel>
              {def.styleKeys
                .filter((sk) => sk !== 'heading')
                .map((sk) => (
                  <StyleEditor key={sk} label={camelToTitle(sk)} styleKey={sk} styles={option.styles ?? {}} onChange={updateOption} />
                ))}
            </div>
          )}

          {/* Danger zone */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--color-danger-border)' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch({ type: 'REMOVE_COMPONENT', payload: selectedId })}
              className="btn btn-danger"
              style={{ width: '100%', fontSize: 12 }}
            >
              Remove Component
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: 'var(--color-text-muted)',
      marginTop: 16, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 600,
        color: 'var(--color-text-secondary)', marginBottom: 3,
      }}>{label}</label>
      {children}
    </div>
  );
}

function OptionFieldInput({ field, value, onChange }: {
  field: OptionField; value: any; onChange: (val: any) => void;
}) {
  const effectiveValue = value ?? field.default;

  switch (field.type) {
    case 'string':
      return (
        <FormSection label={field.label}>
          <input type="text" value={effectiveValue ?? ''} onChange={(e) => onChange(e.target.value)} className="input" style={{ fontSize: 12 }} />
        </FormSection>
      );
    case 'number':
      return (
        <FormSection label={field.label}>
          <input type="number" value={effectiveValue ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="input" style={{ fontSize: 12 }} />
        </FormSection>
      );
    case 'boolean':
      return (
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', cursor: 'pointer', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{field.label}</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={effectiveValue ?? false} onChange={(e) => onChange(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </label>
      );
    case 'select':
      return (
        <FormSection label={field.label}>
          <select value={effectiveValue ?? ''} onChange={(e) => onChange(e.target.value)} className="select" style={{ fontSize: 12 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {field.options?.map((opt) => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, opt.value] : selected.filter((v) => v !== opt.value);
                    onChange(next);
                  }}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{opt.label}</span>
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
            onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch { /* keep raw */ } }}
            className="input"
            style={{ minHeight: 60, fontFamily: 'monospace', fontSize: 11, resize: 'vertical' }}
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
  label: string; styleKey: string;
  styles: Record<string, any>;
  onChange: (path: string, value: any) => void;
}) {
  const current = styles[styleKey] ?? {};
  const [open, setOpen] = React.useState(false);
  const hasValues = current.color || current.fontSize;

  return (
    <div style={{
      marginBottom: 5,
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px', fontSize: 11, fontWeight: 600,
          color: 'var(--color-text-secondary)',
          background: 'var(--color-surface-alt)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {hasValues && <span style={{ width: 7, height: 7, borderRadius: '50%', background: current.color || 'var(--color-primary)' }} />}
          {label}
        </span>
        <span style={{
          fontSize: 9, color: 'var(--color-text-muted)',
          transition: 'transform var(--transition-fast)',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>{'\u25BC'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '7px 10px', display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Color</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={current.color || '#1e293b'}
                    onChange={(e) => onChange(`styles.${styleKey}.color`, e.target.value)}
                    style={{ width: 26, height: 26, border: '1px solid var(--color-border)', borderRadius: 4, padding: 0, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={current.color || ''}
                    onChange={(e) => onChange(`styles.${styleKey}.color`, e.target.value)}
                    placeholder="#1e293b"
                    className="input"
                    style={{ flex: 1, padding: '3px 6px', fontSize: 10, fontFamily: 'monospace' }}
                  />
                </div>
              </div>
              <div style={{ width: 60 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Size</div>
                <input
                  type="number" min={8} max={72}
                  value={current.fontSize || ''}
                  onChange={(e) => onChange(`styles.${styleKey}.fontSize`, e.target.value ? Number(e.target.value) : '')}
                  placeholder="14"
                  className="input"
                  style={{ textAlign: 'center', padding: '3px 4px', fontSize: 10 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SpacingGroup({ label, prefix, values, onChange }: {
  label: string; prefix: string;
  values: Record<string, number>;
  onChange: (path: string, value: any) => void;
}) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'] as const;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 5 }}>{label} (px)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 3 }}>
        {sides.map((side) => {
          const key = side.toLowerCase();
          return (
            <div key={side} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <input
                type="number" min={0}
                value={values[key] ?? 0}
                onChange={(e) => onChange(`${prefix}.${key}`, Number(e.target.value))}
                className="input"
                style={{ textAlign: 'center', padding: 3, fontSize: 11 }}
              />
              <span style={{ fontSize: 8, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{side[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
