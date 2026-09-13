import React, { useCallback } from 'react';
import { useSelectionStore } from '../stores/useSelectionStore';
import { useEngineStore } from '../stores/useEngineStore';
import type { NovaObject, TextObject, RectangleObject, CircleObject, Fill } from '@nova/document';
import { colorToHex, hexToColor, type Color } from '@nova/shared';

export function PropertiesPanel(): React.ReactElement {
  const { selectedObjects, selectedIds } = useSelectionStore();
  const { getEngine } = useEngineStore();

  const updateProp = useCallback(
    (props: Partial<NovaObject>, description?: string) => {
      try {
        const engine = getEngine();
        for (const id of selectedIds) {
          engine.updateObjectProperty(id, props, description);
        }
      } catch {}
    },
    [selectedIds, getEngine]
  );

  const obj = selectedObjects[0];

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: 'var(--color-panel)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          flexShrink: 0,
        }}
      >
        Properties
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!obj ? (
          <EmptyProperties />
        ) : (
          <>
            {/* Object type label */}
            <div style={{ padding: '8px 12px 4px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(97, 114, 243, 0.1)',
                    color: 'var(--color-accent)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {obj.type}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {obj.name}
                </span>
              </div>
            </div>

            {/* Position & Size */}
            <PropSection title="Position & Size">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <PropInput
                  label="X"
                  value={Math.round(obj.x)}
                  onChange={(v) => updateProp({ x: v } as any, 'Move')}
                />
                <PropInput
                  label="Y"
                  value={Math.round(obj.y)}
                  onChange={(v) => updateProp({ y: v } as any, 'Move')}
                />
                <PropInput
                  label="W"
                  value={Math.round(obj.width)}
                  onChange={(v) => updateProp({ width: Math.max(1, v) } as any, 'Resize')}
                />
                <PropInput
                  label="H"
                  value={Math.round(obj.height)}
                  onChange={(v) => updateProp({ height: Math.max(1, v) } as any, 'Resize')}
                />
              </div>
            </PropSection>

            {/* Transform */}
            <PropSection title="Transform">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <PropInput
                  label="Rot"
                  value={Math.round(obj.rotation)}
                  onChange={(v) => updateProp({ rotation: v } as any, 'Rotate')}
                  unit="°"
                />
                <PropInput
                  label="Opacity"
                  value={Math.round(obj.opacity * 100)}
                  onChange={(v) =>
                    updateProp({ opacity: Math.max(0, Math.min(100, v)) / 100 } as any, 'Opacity')
                  }
                  unit="%"
                />
              </div>
            </PropSection>

            {/* Fill */}
            <PropSection title="Fill">
              <FillEditor
                fill={obj.style.fill}
                onChange={(fill) => updateProp({ style: { ...obj.style, fill } } as any, 'Fill')}
              />
            </PropSection>

            {/* Stroke */}
            <PropSection title="Stroke">
              <StrokeEditor
                stroke={obj.style.stroke}
                onChange={(stroke) =>
                  updateProp({ style: { ...obj.style, stroke } } as any, 'Stroke')
                }
              />
            </PropSection>

            {/* Corner Radius (rectangles) */}
            {obj.type === 'rectangle' && (
              <PropSection title="Appearance">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <PropInput
                    label="Radius"
                    value={obj.style.cornerRadius ?? 0}
                    onChange={(v) =>
                      updateProp(
                        { style: { ...obj.style, cornerRadius: Math.max(0, v) } } as any,
                        'Corner radius'
                      )
                    }
                  />
                </div>
              </PropSection>
            )}

            {/* Text properties */}
            {obj.type === 'text' && (
              <TextProperties obj={obj as TextObject} updateProp={updateProp} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyProperties(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        color: 'var(--color-text-tertiary)',
        padding: 24,
        minHeight: 200,
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity={0.5}
      >
        <rect x="4" y="4" width="24" height="24" rx="4" />
        <path d="M10 16h12M16 10v12" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No object selected</p>
        <p style={{ fontSize: 11, marginTop: 4 }}>Select an object to edit its properties</p>
      </div>
    </div>
  );
}

function PropSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function PropInput({
  label,
  value,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}): React.ReactElement {
  const [localValue, setLocalValue] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);

  // Sync external changes when not focused
  React.useEffect(() => {
    if (!focused) setLocalValue(String(value));
  }, [value, focused]);

  const commit = () => {
    const parsed = parseFloat(localValue);
    if (!isNaN(parsed)) onChange(parsed);
    else setLocalValue(String(value));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <span
        style={{
          fontSize: 10,
          color: 'var(--color-text-tertiary)',
          width: 20,
          flexShrink: 0,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
          style={{
            width: '100%',
            height: 24,
            padding: unit ? '0 20px 0 6px' : '0 6px',
            background: 'white',
            border: focused ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            borderRadius: 4,
            fontSize: 12,
            color: 'var(--color-text-primary)',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
            boxShadow: focused ? '0 0 0 2px rgba(97,114,243,0.15)' : 'none',
            transition: 'border-color 0.1s, box-shadow 0.1s',
          }}
        />
        {unit && (
          <span
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 10,
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function FillEditor({
  fill,
  onChange,
}: {
  fill: Fill;
  onChange: (fill: Fill) => void;
}): React.ReactElement {
  const isSolid = fill.type === 'solid';
  const color = isSolid ? ((fill as any).color as Color) : { r: 200, g: 200, b: 200, a: 1 };
  const hex = colorToHex(color);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={isSolid}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ type: 'solid', color: { r: 97, g: 114, b: 243, a: 1 } });
            } else {
              onChange({ type: 'none' });
            }
          }}
          style={{ width: 12, height: 12, cursor: 'pointer' }}
        />
      </label>

      {isSolid && (
        <>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: hex,
              border: '1px solid var(--color-border)',
              flexShrink: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <input
              type="color"
              value={hex}
              onChange={(e) => {
                const c = hexToColor(e.target.value);
                onChange({ type: 'solid', color: { ...c, a: color.a } });
              }}
              style={{
                position: 'absolute',
                inset: '-4px',
                width: 'calc(100% + 8px)',
                height: 'calc(100% + 8px)',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>
          <input
            type="text"
            value={hex.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                const c = hexToColor(val);
                onChange({ type: 'solid', color: { ...c, a: color.a } });
              }
            }}
            style={{
              flex: 1,
              height: 24,
              padding: '0 6px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--color-text-primary)',
              outline: 'none',
              textTransform: 'uppercase',
            }}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(color.a * 100)}
            onChange={(e) => {
              const a = Math.max(0, Math.min(100, parseInt(e.target.value))) / 100;
              onChange({ type: 'solid', color: { ...color, a } });
            }}
            style={{
              width: 44,
              height: 24,
              padding: '0 4px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--color-text-primary)',
              outline: 'none',
              textAlign: 'right',
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>%</span>
        </>
      )}

      {!isSolid && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>None</span>}
    </div>
  );
}

function StrokeEditor({
  stroke,
  onChange,
}: {
  stroke?: { color: Color; width: number; alignment: string };
  onChange: (stroke: any) => void;
}): React.ReactElement {
  const hasStroke = !!stroke;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={hasStroke}
          onChange={(e) => {
            if (e.target.checked) {
              onChange({ color: { r: 0, g: 0, b: 0, a: 1 }, width: 1, alignment: 'center' });
            } else {
              onChange(undefined);
            }
          }}
          style={{ width: 12, height: 12, cursor: 'pointer' }}
        />
      </label>

      {hasStroke && stroke && (
        <>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: colorToHex(stroke.color),
              border: '1px solid var(--color-border)',
              flexShrink: 0,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <input
              type="color"
              value={colorToHex(stroke.color)}
              onChange={(e) => {
                const c = hexToColor(e.target.value);
                onChange({ ...stroke, color: { ...c, a: stroke.color.a } });
              }}
              style={{
                position: 'absolute',
                inset: '-4px',
                width: 'calc(100% + 8px)',
                height: 'calc(100% + 8px)',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>
          <PropInput
            label="W"
            value={stroke.width}
            onChange={(v) => onChange({ ...stroke, width: Math.max(0.1, v) })}
          />
        </>
      )}

      {!hasStroke && (
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>None</span>
      )}
    </div>
  );
}

function TextProperties({
  obj,
  updateProp,
}: {
  obj: TextObject;
  updateProp: (props: Partial<NovaObject>, description?: string) => void;
}): React.ReactElement {
  const updateText = (textStyle: Partial<typeof obj.textStyle>) => {
    updateProp({ textStyle: { ...obj.textStyle, ...textStyle } } as any, 'Text style');
  };

  return (
    <>
      <PropSection title="Text">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <select
              value={obj.textStyle.fontFamily.split(',')[0]?.trim() ?? 'Inter'}
              onChange={(e) => updateText({ fontFamily: e.target.value })}
              style={{
                width: '100%',
                height: 26,
                padding: '0 6px',
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            >
              {[
                'Inter',
                'Roboto',
                'Open Sans',
                'Lato',
                'Montserrat',
                'Poppins',
                'Georgia',
                'Arial',
                'Times New Roman',
              ].map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <PropInput
            label="Size"
            value={obj.textStyle.fontSize}
            onChange={(v) => updateText({ fontSize: Math.max(6, v) })}
          />
          <PropInput
            label="LH"
            value={obj.textStyle.lineHeight}
            onChange={(v) => updateText({ lineHeight: Math.max(0.5, v) })}
          />
        </div>

        {/* Bold / Italic */}
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          <StyleToggle
            label="B"
            title="Bold"
            bold
            active={obj.textStyle.fontWeight === 'bold' || obj.textStyle.fontWeight === '700'}
            onClick={() =>
              updateText({ fontWeight: obj.textStyle.fontWeight === 'bold' ? 'normal' : 'bold' })
            }
          />
          <StyleToggle
            label="I"
            title="Italic"
            italic
            active={obj.textStyle.fontStyle === 'italic'}
            onClick={() =>
              updateText({ fontStyle: obj.textStyle.fontStyle === 'italic' ? 'normal' : 'italic' })
            }
          />
          <div style={{ flex: 1 }} />
          {/* Alignment */}
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              title={`Align ${align}`}
              onClick={() => updateText({ textAlign: align })}
              style={{
                width: 24,
                height: 24,
                border: 'none',
                borderRadius: 4,
                background:
                  obj.textStyle.textAlign === align ? 'rgba(97,114,243,0.15)' : 'transparent',
                color:
                  obj.textStyle.textAlign === align
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlignIcon align={align} />
            </button>
          ))}
        </div>
      </PropSection>
    </>
  );
}

function StyleToggle({
  label,
  title,
  active,
  bold,
  italic,
  onClick,
}: {
  label: string;
  title: string;
  active: boolean;
  bold?: boolean;
  italic?: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        border: 'none',
        borderRadius: 4,
        background: active ? 'rgba(97,114,243,0.15)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: bold ? 700 : 400,
        fontStyle: italic ? 'italic' : 'normal',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {label}
    </button>
  );
}

function AlignIcon({ align }: { align: 'left' | 'center' | 'right' }): React.ReactElement {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      {align === 'left' && (
        <>
          <line x1="1" y1="3" x2="11" y2="3" />
          <line x1="1" y1="6" x2="8" y2="6" />
          <line x1="1" y1="9" x2="11" y2="9" />
        </>
      )}
      {align === 'center' && (
        <>
          <line x1="1" y1="3" x2="11" y2="3" />
          <line x1="3" y1="6" x2="9" y2="6" />
          <line x1="1" y1="9" x2="11" y2="9" />
        </>
      )}
      {align === 'right' && (
        <>
          <line x1="1" y1="3" x2="11" y2="3" />
          <line x1="4" y1="6" x2="11" y2="6" />
          <line x1="1" y1="9" x2="11" y2="9" />
        </>
      )}
    </svg>
  );
}
