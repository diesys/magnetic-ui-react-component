import { useState, ReactNode } from 'react';

export function Toggle({
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

export function Slider({
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

export function Select<T extends string>({
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

export function Section({
  title, tooltip, children, defaultOpen = true,
}: {
  title: string; tooltip: string; children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col border-b border-dashed border-b-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        title={tooltip}
        className="flex items-center justify-between w-full py-2 group"
      >
        <span className="text-[10px] uppercase tracking-widest font-semibold transition-colors group-hover:text-white text-white/30">
          {title}
        </span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform duration-200 text-white/20 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
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

export function EffectControl({
  label, enabled, onToggle, value, min, max, step, onChange, dimmed = false, children,
}: {
  label: string; enabled: boolean; onToggle: (v: boolean) => void;
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; dimmed?: boolean; children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Toggle label={label} value={enabled} onChange={onToggle} dimmed={dimmed} />
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
