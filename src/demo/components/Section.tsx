import { type ReactNode, useState } from "react";

export function Section({
	title,
	tooltip,
	children,
	defaultOpen = true,
}: {
	title: string;
	tooltip: string;
	children: ReactNode;
	defaultOpen?: boolean;
}) {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="flex flex-col">
			<button
				data-role-select
				type="button"
				onClick={() => setOpen((o) => !o)}
				title={tooltip}
			>
				{title}
				<span
					className={`transition-transform duration-200 text-inherit ${open ? "rotate-180" : ""}`}
				>
					⌄
				</span>
			</button>
			<div
				className="overflow-hidden transition-all duration-200"
				style={{ maxHeight: open ? "1000px" : "0px", opacity: open ? 1 : 0 }}
			>
				<div className="flex flex-col gap-3 pb-4">{children}</div>
			</div>
		</div>
	);
}
