export function Slider({
	label,
	value,
	min,
	max,
	step = 0.01,
	onChange,
	dimmed = false,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (v: number) => void;
	dimmed?: boolean;
}) {
	return (
		<div
			className={`flex flex-col gap-1 transition-opacity ${dimmed ? "opacity-30 pointer-events-none" : ""}`}
		>
			<div className="flex text-[10px] justify-between items-center">
				<span className=" text-foreground/30 italic uppercase">{label}</span>
				<span className="text-xs -mb-1.5 font-mono text-foreground/50">
					{value.toFixed(step < 1 ? 2 : 0)}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-mode  h-1.5 rounded-full"
			/>
		</div>
	);
}
