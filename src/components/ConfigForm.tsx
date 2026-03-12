import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, findInAllSections, collectAllComponents } from '../state';
import { registryMap, type OptionField, type FeatureToggle, type ClickActionDef, type ButtonActionDef } from '../component-registry';
import { ChevronDown, Paintbrush, Trash2, Zap, MousePointerClick } from 'lucide-react';

function isVisibleForVariant(item: { visibleWhen?: { variant?: string | string[] } }, currentVariant: string | undefined): boolean {
  if (!item.visibleWhen?.variant) return true;
  const allowed = item.visibleWhen.variant;
  if (Array.isArray(allowed)) return !currentVariant || allowed.includes(currentVariant);
  return !currentVariant || allowed === currentVariant;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

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

  const currentVariant = option.variant ?? def.variants?.[0]?.value;
  const visibleOptions = def.options.filter((f) => isVisibleForVariant(f, currentVariant));
  const visibleFeatures = def.features.filter((f) => isVisibleForVariant(f, currentVariant));
  const elementStyleKeys = def.styleKeys.filter((sk) => sk !== 'heading');

  const optionGroups = groupBy(visibleOptions, (f) => f.group ?? '');

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
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--color-primary-light)',
              borderRadius: 8, color: 'var(--color-primary)',
            }}>{def.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{def.label}</h3>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</div>
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

          <Divider />

          {/* Options (grouped) */}
          {visibleOptions.length > 0 && (
            <div>
              <SectionLabel>Options</SectionLabel>
              {Array.from(optionGroups.entries()).map(([groupName, fields]) => (
                <div key={groupName}>
                  {groupName && (
                    <div style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--color-primary)',
                      marginTop: 10, marginBottom: 4,
                      padding: '3px 8px', background: 'var(--color-primary-light)',
                      borderRadius: 4, display: 'inline-block',
                    }}>{groupName}</div>
                  )}
                  {fields.map((field) => (
                    <OptionFieldInput
                      key={field.key}
                      field={field}
                      value={option[field.key]}
                      onChange={(val) => updateOption(field.key, val)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Features */}
          {visibleFeatures.length > 0 && (
            <div>
              <SectionLabel>Features</SectionLabel>
              <div style={{
                background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)',
                padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                {visibleFeatures.map((feat) => {
                  const checked = option.features?.[feat.key] ?? feat.default;
                  return (
                    <label key={feat.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '5px 6px', cursor: 'pointer', borderRadius: 4,
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
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
            </div>
          )}

          {/* Click Actions */}
          {def.clickActions && def.clickActions.length > 0 && (
            <ClickActionsSection
              actions={def.clickActions}
              option={option}
              selectedId={selectedId}
              onChange={updateOption}
            />
          )}

          {/* Button Actions */}
          {def.buttonActions && def.buttonActions.length > 0 && (
            <ButtonActionsSection
              actions={def.buttonActions}
              option={option}
              selectedId={selectedId}
              onChange={updateOption}
            />
          )}

          <Divider />

          {/* Spacing -- visual box model */}
          <div>
            <SectionLabel>Spacing</SectionLabel>
            <BoxModelEditor
              label="Margin"
              prefix="spacing.margin"
              values={option.spacing?.margin ?? {}}
              onChange={updateOption}
              color="#f59e0b"
            />
          </div>

          <Divider />

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

          {/* Element Styling -- collapsible Advanced */}
          {elementStyleKeys.length > 0 && (
            <CollapsibleSection
              title="Advanced Styling"
              icon={<Paintbrush size={13} />}
              defaultOpen={false}
              count={elementStyleKeys.length}
            >
              {elementStyleKeys.map((sk) => (
                <StyleEditor key={sk} label={camelToTitle(sk)} styleKey={sk} styles={option.styles ?? {}} onChange={updateOption} />
              ))}
            </CollapsibleSection>
          )}

          {/* Danger zone */}
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--color-danger-border)' }}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch({ type: 'REMOVE_COMPONENT', payload: selectedId })}
              className="btn btn-danger"
              style={{ width: '100%', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Trash2 size={13} />
              Remove Component
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'linear-gradient(to right, transparent, var(--color-border), transparent)', margin: '14px 0' }} />;
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

function CollapsibleSection({ title, icon, defaultOpen, count, children }: {
  title: string; icon?: React.ReactNode; defaultOpen: boolean; count?: number; children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{
      marginTop: 14,
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 10px', fontSize: 11, fontWeight: 600,
          color: 'var(--color-text-secondary)',
          background: open ? 'var(--color-surface-alt)' : '#fff',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'background 0.15s',
        }}
      >
        {icon}
        <span style={{ flex: 1, textAlign: 'left' }}>{title}</span>
        {count !== undefined && (
          <span style={{
            fontSize: 9, fontWeight: 700, background: 'var(--color-primary-light)',
            color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 10,
          }}>{count}</span>
        )}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={14} />
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
            <div style={{ padding: '10px' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {field.options?.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const next = isSelected ? selected.filter((v) => v !== opt.value) : [...selected, opt.value];
                    onChange(next);
                  }}
                  style={{
                    padding: '3px 10px', fontSize: 11, fontWeight: isSelected ? 600 : 400,
                    borderRadius: 12,
                    border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-primary-light)' : '#fff',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    lineHeight: '18px',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
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
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={12} />
        </motion.span>
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

function BoxModelEditor({ label, prefix, values, onChange, color }: {
  label: string; prefix: string;
  values: Record<string, number>;
  onChange: (path: string, value: any) => void;
  color: string;
}) {
  const sides = [
    { key: 'top', label: 'T' },
    { key: 'right', label: 'R' },
    { key: 'bottom', label: 'B' },
    { key: 'left', label: 'L' },
  ];

  const boxColor = `${color}18`;
  const borderColor = `${color}40`;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{
        position: 'relative',
        background: boxColor,
        border: `1.5px dashed ${borderColor}`,
        borderRadius: 6,
        padding: '6px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gridTemplateRows: 'auto auto auto',
        alignItems: 'center',
        justifyItems: 'center',
        gap: 2,
      }}>
        {/* Top */}
        <div style={{ gridColumn: '2', gridRow: '1' }}>
          <BoxInput
            value={values.top ?? 0}
            onChange={(v) => onChange(`${prefix}.top`, v)}
            label="T"
          />
        </div>
        {/* Left */}
        <div style={{ gridColumn: '1', gridRow: '2' }}>
          <BoxInput
            value={values.left ?? 0}
            onChange={(v) => onChange(`${prefix}.left`, v)}
            label="L"
          />
        </div>
        {/* Center label */}
        <div style={{
          gridColumn: '2', gridRow: '2',
          width: 44, height: 28,
          background: '#fff', borderRadius: 4,
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {label}
        </div>
        {/* Right */}
        <div style={{ gridColumn: '3', gridRow: '2' }}>
          <BoxInput
            value={values.right ?? 0}
            onChange={(v) => onChange(`${prefix}.right`, v)}
            label="R"
          />
        </div>
        {/* Bottom */}
        <div style={{ gridColumn: '2', gridRow: '3' }}>
          <BoxInput
            value={values.bottom ?? 0}
            onChange={(v) => onChange(`${prefix}.bottom`, v)}
            label="B"
          />
        </div>
      </div>
    </div>
  );
}

function BoxInput({ value, onChange, label }: {
  value: number; onChange: (v: number) => void; label: string;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: 36, textAlign: 'center', padding: '3px 2px',
          fontSize: 11, fontWeight: 600,
          border: '1px solid var(--color-border)',
          borderRadius: 4, background: '#fff',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
        }}
        title={label}
      />
    </div>
  );
}

function ClickActionsSection({ actions, option, selectedId, onChange }: {
  actions: ClickActionDef[];
  option: Record<string, any>;
  selectedId: string;
  onChange: (path: string, value: any) => void;
}) {
  const { state } = useEditor();
  const allComponents = React.useMemo(() => collectAllComponents(state.sections), [state.sections]);
  const targets = allComponents.filter((c) => c.name !== selectedId);

  const clickActions: Record<string, any> = option.clickActions ?? {};

  return (
    <CollapsibleSection
      title="Click Actions"
      icon={<Zap size={13} />}
      defaultOpen={false}
      count={actions.length}
    >
      {actions.map((action) => {
        const cfg = clickActions[action.key] ?? {};
        return (
          <div key={action.key} style={{
            marginBottom: 10, padding: '8px 10px',
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              {action.label}
            </div>

            {/* Target selector */}
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>
                Target Component
              </label>
              <select
                className="select"
                style={{ fontSize: 11, width: '100%' }}
                value={cfg.target ?? ''}
                onChange={(e) => onChange(`clickActions.${action.key}.target`, e.target.value || null)}
              >
                <option value="">— None —</option>
                {targets.map((t) => {
                  const tDef = registryMap.get(t.type);
                  return (
                    <option key={t.name} value={t.name}>
                      {tDef?.label ?? t.type} ({t.name.split('-').slice(0, -1).join('-') || t.name})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Send visibility toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 6, padding: '3px 0',
            }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Send Visibility</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={cfg.sendVisibility ?? false}
                  onChange={(e) => onChange(`clickActions.${action.key}.sendVisibility`, e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Data field chips */}
            {action.dataFields.length > 0 && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                  Data to Send
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {action.dataFields.map((df) => {
                    const selected = (cfg.dataFields ?? []).includes(df.key);
                    return (
                      <button
                        key={df.key}
                        onClick={() => {
                          const current: string[] = cfg.dataFields ?? [];
                          const next = selected
                            ? current.filter((k: string) => k !== df.key)
                            : [...current, df.key];
                          onChange(`clickActions.${action.key}.dataFields`, next);
                        }}
                        style={{
                          padding: '3px 8px', fontSize: 10, fontWeight: 600,
                          borderRadius: 10, cursor: 'pointer',
                          border: selected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: selected ? 'var(--color-primary-light)' : '#fff',
                          color: selected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {df.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </CollapsibleSection>
  );
}

function ButtonActionsSection({ actions, option, selectedId, onChange }: {
  actions: ButtonActionDef[];
  option: Record<string, any>;
  selectedId: string;
  onChange: (path: string, value: any) => void;
}) {
  const { state } = useEditor();
  const allComponents = React.useMemo(() => collectAllComponents(state.sections), [state.sections]);
  const targets = allComponents.filter((c) => c.name !== selectedId);

  const buttonActions: Record<string, any> = option.buttonActions ?? {};

  return (
    <CollapsibleSection
      title="Button Actions"
      icon={<MousePointerClick size={13} />}
      defaultOpen={false}
      count={actions.length}
    >
      {actions.map((action) => {
        const cfg = buttonActions[action.key] ?? {};
        const hasStandard = !!cfg.standard;
        const hasMessage = !!cfg.message?.target;

        return (
          <div key={action.key} style={{
            marginBottom: 10, padding: '8px 10px',
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              {action.label}
            </div>

            {/* Standard action */}
            {action.standardActions.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>
                  Standard Action
                </label>
                <select
                  className="select"
                  style={{ fontSize: 11, width: '100%' }}
                  value={cfg.standard ?? ''}
                  onChange={(e) => onChange(`buttonActions.${action.key}.standard`, e.target.value || null)}
                >
                  <option value="">— None —</option>
                  {action.standardActions.map((sa) => (
                    <option key={sa.value} value={sa.value}>{sa.label}</option>
                  ))}
                </select>
                {hasStandard && (
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                    {action.standardActions.find((sa) => sa.value === cfg.standard)?.description}
                  </div>
                )}
              </div>
            )}

            {/* Message event */}
            <div style={{
              marginTop: 6, paddingTop: 6,
              borderTop: '1px solid var(--color-border)',
            }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>
                Message Event
              </label>
              <select
                className="select"
                style={{ fontSize: 11, width: '100%', marginBottom: 4 }}
                value={cfg.message?.target ?? ''}
                onChange={(e) => onChange(`buttonActions.${action.key}.message.target`, e.target.value || null)}
              >
                <option value="">— None —</option>
                {targets.map((t) => {
                  const tDef = registryMap.get(t.type);
                  return (
                    <option key={t.name} value={t.name}>
                      {tDef?.label ?? t.type} ({t.name.split('-').slice(0, -1).join('-') || t.name})
                    </option>
                  );
                })}
              </select>

              {hasMessage && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '3px 0',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Send Visibility</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={cfg.message?.sendVisibility ?? false}
                      onChange={(e) => onChange(`buttonActions.${action.key}.message.sendVisibility`, e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </CollapsibleSection>
  );
}
