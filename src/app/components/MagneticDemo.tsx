/**
 * MagneticDemo.tsx
 *
 * Interactive demo for the <Magnetic> component.
 * Shows a button and a card as live examples, with a full control panel
 * to tweak every available prop in real time.
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { Magnetic, MagneticProps, ModeType } from './Magnetic';

const CONFIG: MagneticProps = {
  radius:           150,
  falloff:          'quadratic',
  mode:             'attract',
  disabled:         false,
  move:             true,  moveIntensity:    40,
  rotate:           false, rotateIntensity:  15,
  skew:             false, skewIntensity:    10,
  stretch:          false, stretchIntensity: 0.3,
  scale:            false, scaleIntensity:   0.2,
  tilt:             true,  tiltIntensity:    15,
  perspective:      800,
  opacity:          false, opacityIntensity: 0.4,
  spring:           true,
  springStiffness:  0.15,
  springDamping: 0.75,
  children:         null,
};

// ─── Small reusable control primitives ───────────────────────────────────────

/** Toggle switch — used inside effect rows */
function Toggle({
  label, value, onChange, dimmed = false,
}: { label: string; value: boolean; onChange: (v: boolean) => void; dimmed?: boolean }) {
  return (
    <label
      className={`flex items-center gap-2 cursor-pointer select-none transition-opacity ${dimmed ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <div
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-violet-500' : 'bg-white/10'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="text-xs text-white/70">{label}</span>
    </label>
  );
}

/** Labelled range slider */
function Slider({
  label, value, min, max, step = 0.01, onChange, dimmed = false,
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; dimmed?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 transition-opacity ${dimmed ? 'opacity-30 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-xs font-mono text-violet-400">
          {value.toFixed(step < 1 ? 2 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-violet-400 h-1.5 rounded-full"
      />
    </div>
  );
}

/** Select dropdown */
function Select<T extends string>({
  label, value, options, onChange, dimmed = false,
}: {
  label: string; value: T; options: { value: T; label: string }[];
  onChange: (v: T) => void; dimmed?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 transition-opacity ${dimmed ? 'opacity-30 pointer-events-none' : ''}`}>
      <span className="text-xs text-white/50">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="text-white text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 focus:outline-none focus:border-violet-400"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

/**
 * Collapsible panel with a one-word title and a tooltip for more context.
 * Clicking the header toggles open/closed.
 */
function Section({
  title, tooltip, children, defaultOpen = true,
}: {
  title: string; tooltip: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border-b border-dashed border-b-white/10">
      {/* Header row — clickable, tooltip on hover */}
      <button
        onClick={() => setOpen(o => !o)}
        title={tooltip}
        className="flex items-center justify-between w-full py-2 group"
      >
        <span
          className="text-[10px] uppercase tracking-widest font-semibold transition-colors group-hover:text-white text-white/30"
        >
          {title}
        </span>
        {/* Chevron rotates when open */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className="transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Collapsible body */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: open ? '1000px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="flex flex-col gap-3 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Effect control row ───────────────────────────────────────────────────────

/**
 * Toggle + conditionally-visible Slider.
 * The slider appears only when the effect is enabled.
 * Extra children (e.g. perspective sub-slider) are rendered below the main slider.
 */
function EffectControl({
  label, enabled, onToggle, value, min, max, step, onChange, dimmed = false, children,
}: {
  label: string; enabled: boolean; onToggle: (v: boolean) => void;
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; dimmed?: boolean; children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Toggle label={label} value={enabled} onChange={onToggle} dimmed={dimmed} />
      {/* Slider is only rendered (and animated in) when effect is active */}
      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: enabled && !dimmed ? '120px' : '0px', opacity: enabled && !dimmed ? 1 : 0 }}
      >
        <div className="flex flex-col gap-2 pl-[4px] pr-[0px] pt-[4px] pb-[8px]">
          <Slider label="intensity" value={value} min={min} max={max} step={step} onChange={onChange} />
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Demo stage elements ──────────────────────────────────────────────────────

const CARD_IMAGE = 'https://images.unsplash.com/photo-1771930629963-150567580932?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjBncmFkaWVudCUyMGdlb21ldHJpYyUyMGFydHxlbnwxfHx8fDE3NzI5Mjk2NTB8MA&ixlib=rb-4.1.0&q=80&w=1080';

function DemoCard() {
  return (
    <div className="w-56 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm bg-white/5 border border-white/10">
      <img src={CARD_IMAGE} alt="abstract" className="w-full h-28 object-cover" />
      <div className="p-4 flex flex-col gap-2">
        <p className="text-white text-sm font-semibold">Magnetic Card</p>
        <p className="text-xs leading-relaxed text-white/50">
          Move your mouse near this card to feel the gravitational pull.
        </p>
        <div className="flex gap-2 mt-1">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/30">
            React
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/30">
            Physics
          </span>
        </div>
      </div>
    </div>
  );
}

function DemoButton() {
  return (
    <button
      className="px-8 py-4 rounded-xl text-white text-sm cursor-pointer transition-colors bg-gradient-to-br from-violet-600 to-violet-800 shadow-[0_8px_32px_rgba(109,40,217,0.4)] border border-violet-300/30"
    >
      ✦ Magnetic Button
    </button>
  );
}

// ─── Mouse radius visualizer ──────────────────────────────────────────────────

function RadiusOverlay({ radius, show }: { radius: number; show: boolean }) {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!areaRef.current) return;
      const rect = areaRef.current.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div ref={areaRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {show && (
        <div
          style={{
            position: 'absolute',
            left:   pos.x - radius,
            top:    pos.y - radius,
            width:  radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            border: '1px dashed rgba(167,139,250,0.25)',
            transition: 'width 0.15s, height 0.15s, left 0.05s, top 0.05s',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// ─── Main Demo component ──────────────────────────────────────────────────────

export function MagneticDemo() {
  const [config, setConfig] = useState<MagneticProps>(CONFIG);
  const [showRadius, setShowRadius] = useState(true);

  // Partial config update helper
  const set = <K extends keyof MagneticProps>(key: K, value: MagneticProps[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  // Whether all effects are frozen (disabled mode)
  const isDisabled = config.disabled;

  // Props forwarded to both <Magnetic> instances
  const magneticProps: MagneticProps = { ...config };

  return (
    <div className="min-h-screen max-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Demo stage ──────────────────────────────────────────────── */}
        <main
          className="flex-1 relative flex flex-col items-center justify-center gap-16 p-4"
          style={{ background: 'radial-gradient(circle at 50% 50%, #1a0a2e 0%, #0d0d14 70%)' }}
        >
          <header className="shrink-0 mt-10">
            <h1 className="text-white font-mono font-bold">&lt;Magnetic/&gt;</h1>
            <p className="text-sm mt-1 text-white/35">
              Physics-inspired mouse interaction component for React
            </p>
          </header>

          <RadiusOverlay radius={config.radius ?? 150} show={showRadius && !isDisabled} />

          {/* Demo elements */}
          <div className="flex flex-wrap items-center justify-center gap-20 grow">
            <div className="flex flex-col items-center gap-4">
              <Magnetic {...magneticProps}>
                <DemoButton />
              </Magnetic>
              <span className="text-[10px] uppercase tracking-widest text-white/20">Button</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Magnetic {...magneticProps}>
                <DemoCard />
              </Magnetic>
              <span className="text-[10px] uppercase tracking-widest text-white/20">Card</span>
            </div>
          </div>

          <p className="text-xs text-white/20">
            {/* Mode badge */}
            <span
              className="flex items-center gap-2 px-3 py-1 rounded-full text-xs w-fit mx-auto my-2"
              style={
                isDisabled
                  ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                  : config.mode === 'attract'
                    ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: 'rgba(196,181,253,1)' }
                    : { background: 'rgba(244,63,94,0.1)',  border: '1px solid rgba(244,63,94,0.3)',  color: 'rgba(253,164,175,1)' }
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isDisabled
                    ? 'rgba(255,255,255,0.2)'
                    : config.mode === 'attract' ? 'rgba(167,139,250,1)' : 'rgba(251,113,133,1)',
                }}
              />
              {isDisabled ? '○ Disabled' : config.mode === 'attract' ? '⊕ Attract mode' : '⊖ Repel mode'}
            </span>

            Move your cursor over or near the elements
          </p>
        </main>

        {/* ── Controls sidebar ────────────────────────────────────────── */}
        <aside
          className="w-72 overflow-y-auto flex max-h-full flex-col divide-y divide-dashed divide-b-white/10 p-4 border-l border-white/5 bg-[#0a0a0f]"
        >
            {/* Three-way mode selector: Attract | Repel | Disabled */}
            <div className="flex gap-1.5 sticky -top-2 z-20 -mx-0.5">
              {(
                [
                  { label: '⊕ Attract', mode: 'attract' as ModeType, activeStyle: { background: 'rgba(109,40,217,0.3)', border: '1px solid rgba(139,92,246,0.4)', color: 'rgba(196,181,253,1)' } },
                  { label: '⊖ Repel',   mode: 'repel'   as ModeType, activeStyle: { background: 'rgba(190,18,60,0.25)',  border: '1px solid rgba(244,63,94,0.4)',  color: 'rgba(253,164,175,1)' } },
                  { label: '○ Off',     mode: null,                   activeStyle: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' } },
                ] as const
              ).map(item => {
                // "Off" button maps to disabled=true, others to disabled=false + mode
                const isActive = item.mode === null ? isDisabled : (!isDisabled && config.mode === item.mode);
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.mode === null) {
                        set('disabled', true);
                      } else {
                        setConfig(prev => ({ ...prev, disabled: false, mode: item.mode! }));
                      }
                    }}
                    className="cursor-pointer flex-1 py-1.5 rounded-lg text-[11px] transition-all backdrop-blur-lg"
                    style={
                      isActive
                        ? item.activeStyle
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>



            {/* ── CORE ───────────────────────────────────────────────── */}
            <Section title="Core" tooltip="Activation radius, interaction mode, falloff curve and spring physics">

              {/* Radius and falloff — dimmed when disabled */}
              <Slider
                label="Radius (px)" value={config.radius ?? 0} min={30} max={500} step={1}
                onChange={v => set('radius', v)} dimmed={isDisabled}
              />
              <Toggle label="Show radius overlay" value={showRadius} onChange={setShowRadius} dimmed={isDisabled} />
              <Select
                label="Falloff curve" value={config.falloff ?? 'quadratic'}
                options={[
                  { value: 'linear',      label: 'Linear — clean drop' },
                  { value: 'quadratic',   label: 'Quadratic — smooth' },
                  { value: 'inverse',     label: 'Inverse — gravity-like' },
                  { value: 'exponential', label: 'Exponential — always on' },
                ]}
                onChange={v => set('falloff', v)} dimmed={isDisabled}
              />

              {/* ── Spring physics — nested inside Core ─────────────── */}
              <Toggle label="Spring" value={config.spring ?? true} onChange={v => set('spring', v)} dimmed={isDisabled} />
              <div
                className="overflow-hidden transition-all duration-200 flex flex-col gap-3 pb-2"
                style={{ maxHeight: config.spring && !isDisabled ? '200px' : '0px', opacity: config.spring && !isDisabled ? 1 : 0 }}
              >
                <Slider
                  label="Stiffness" value={config.springStiffness ?? 0.15} min={0.01} max={0.6} step={0.01}
                  onChange={v => set('springStiffness', v)}
                />
                <Slider
                  label="Damping" value={config.springDamping ?? 0.25} min={0.1} max={0.99} step={0.01}
                  onChange={v => set('springDamping', v)}
                />
              </div>
            </Section>

            {/* ── EFFECTS ────────────────────────────────────────────── */}
            <Section title="Effects" tooltip="Transform effects applied when mouse is within radius">

              <EffectControl
                label="Move — translateX/Y"
                enabled={config.move ?? true} onToggle={v => set('move', v)}
                value={config.moveIntensity ?? 40} min={0} max={120} step={1}
                onChange={v => set('moveIntensity', v)} dimmed={isDisabled}
              />
              <EffectControl
                label="Rotate — rotate(deg)"
                enabled={config.rotate ?? false} onToggle={v => set('rotate', v)}
                value={config.rotateIntensity ?? 15} min={0} max={45} step={0.5}
                onChange={v => set('rotateIntensity', v)} dimmed={isDisabled}
              />
              <EffectControl
                label="Skew — skewX/Y"
                enabled={config.skew ?? false} onToggle={v => set('skew', v)}
                value={config.skewIntensity ?? 10} min={0} max={30} step={0.5}
                onChange={v => set('skewIntensity', v)} dimmed={isDisabled}
              />
              <EffectControl
                label="Stretch — axis scale"
                enabled={config.stretch ?? false} onToggle={v => set('stretch', v)}
                value={config.stretchIntensity ?? 0.3} min={0} max={1} step={0.01}
                onChange={v => set('stretchIntensity', v)} dimmed={isDisabled}
              />
              <EffectControl
                label="Scale — uniform"
                enabled={config.scale ?? false} onToggle={v => set('scale', v)}
                value={config.scaleIntensity ?? 0.2} min={0} max={1} step={0.01}
                onChange={v => set('scaleIntensity', v)} dimmed={isDisabled}
              />

              {/* Tilt — includes perspective sub-slider when active */}
              <EffectControl
                label="Tilt — 3D rotateX/Y"
                enabled={config.tilt ?? false} onToggle={v => set('tilt', v)}
                value={config.tiltIntensity ?? 15} min={0} max={45} step={0.5}
                onChange={v => set('tiltIntensity', v)} dimmed={isDisabled}
              >
                {/* Perspective slider nested below tilt intensity */}
                <Slider
                  label="Perspective (px)" value={config.perspective ?? 800} min={100} max={2000} step={10}
                  onChange={v => set('perspective', v)}
                />
              </EffectControl>

              <EffectControl
                label="Opacity — dim on proximity"
                enabled={config.opacity ?? false} onToggle={v => set('opacity', v)}
                value={config.opacityIntensity ?? 0.4} min={0} max={1} step={0.01}
                onChange={v => set('opacityIntensity', v)} dimmed={isDisabled}
              />
            </Section>

            {/* ── CODE ───────────────────────────────────────────────── */}
            <Section title="Code" tooltip="Live JSX snippet — copy and paste into your project" defaultOpen={false}>
              <pre
                className="text-[10px] rounded-lg p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap text-violet-200/70 bg-white/3 border border-white/10"
              >
{`<Magnetic
  radius={${config.radius}}
  falloff="${config.falloff}"
  mode="${config.mode}"
  move={${config.move}}
  moveIntensity={${config.moveIntensity}}
  rotate={${config.rotate}}
  rotateIntensity={${config.rotateIntensity}}
  skew={${config.skew}}
  skewIntensity={${config.skewIntensity}}
  stretch={${config.stretch}}
  stretchIntensity={${config.stretchIntensity}}
  scale={${config.scale}}
  scaleIntensity={${config.scaleIntensity}}
  tilt={${config.tilt}}
  tiltIntensity={${config.tiltIntensity}}
  perspective={${config.perspective}}
  opacity={${config.opacity}}
  opacityIntensity={${config.opacityIntensity}}
  spring={${config.spring}}
  springStiffness={${config.springStiffness}}
  springDamping={${config.springDamping}}
>`}
              </pre>
            </Section>

            {/* Reset */}
            <button
              onClick={() => setConfig(CONFIG)}
              className="cursor-pointer py-2 rounded-lg text-xs transition-colors mt-auto sticky shadow-lg -mx-0.5 -bottom-2 bg-white/10 backdrop-blur-sm color-white/40 border border-white/10"
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              ↺ Reset to defaults
            </button>
        </aside>
      </div>
    </div>
  );
}
