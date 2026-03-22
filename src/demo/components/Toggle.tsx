export function Toggle({
	label,
	value,
	onChange,
	dimmed = false,
}: {
	label: string;
	value: boolean;
	onChange: (v: boolean) => void;
	dimmed?: boolean;
}) {
	return (
		<label
			htmlFor={label}
			onClick={() => onChange(!value)}
			onKeyUp={() => onChange(!value)}
			className={`flex items-center gap-2 cursor-pointer select-none transition-opacity ${dimmed ? "opacity-30 pointer-events-none" : ""}`}
		>
			<span className="text-xs text-foreground/70 grow">{label}</span>
			<button
				data-type="switch"
				type="button"
				tabIndex={0}
				className={value ? "bg-mode" : "bg-foreground/10"}
			>
				<input
					type="checkbox"
					name={label}
					checked={value}
					onChange={() => onChange(!value)}
					className={value ? "translate-x-4" : "translate-x-0"}
				/>
			</button>
		</label>
	);
}
