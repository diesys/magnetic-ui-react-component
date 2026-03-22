import type { ReactNode } from "react";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

export function EffectControl({
	label,
	enabled,
	onToggle,
	value,
	min,
	max,
	step,
	onChange,
	dimmed = false,
	children,
}: {
	label: string;
	enabled: boolean;
	onToggle: (v: boolean) => void;
	value: number;
	min: number;
	max: number;
	step?: number;
	onChange: (v: number) => void;
	dimmed?: boolean;
	children?: ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<Toggle
				label={label}
				value={enabled}
				onChange={onToggle}
				dimmed={dimmed}
			/>
			<div
				className="overflow-hidden transition-all duration-200"
				style={{
					maxHeight: enabled && !dimmed ? "120px" : "0px",
					opacity: enabled && !dimmed ? 1 : 0,
				}}
			>
				<div className="flex flex-col gap-2 pb-2">
					<Slider
						label="intensity"
						value={value}
						min={min}
						max={max}
						step={step}
						onChange={onChange}
					/>
					{children}
				</div>
			</div>
		</div>
	);
}
