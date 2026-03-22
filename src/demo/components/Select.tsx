export function Select<T extends string>({
	label,
	value,
	options,
	onChange,
	dimmed = false,
}: {
	label: string;
	value: T;
	options: { value: T; label: string }[];
	onChange: (v: T) => void;
	dimmed?: boolean;
}) {
	return (
		<div
			className={`flex flex-col gap-1 transition-opacity ${dimmed ? "opacity-30 pointer-events-none" : ""}`}
		>
			<span className="text-xs text-foreground/50">{label}</span>
			<select value={value} onChange={(e) => onChange(e.target.value as T)}>
				{options.map((o) => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	);
}
