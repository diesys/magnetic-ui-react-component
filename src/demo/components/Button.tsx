export function Button() {
	return (
		<button
			type="button"
			className="pl-5 pr-6 py-4 border border-mode rounded-xl text-foreground text-sm cursor-pointer"
			style={{
				boxShadow: `0 -.15rem 1.5rem -.5rem var(--mode)`,
				background: `linear-gradient(to bottom right, color-mix(in oklch, var(--mode), transparent 90%), color-mix(in oklch, var(--mode), transparent 0%))`,
			}}
		>
			<span className="text-2xl mr-3">✦</span> Magnetic Button
		</button>
	);
}
