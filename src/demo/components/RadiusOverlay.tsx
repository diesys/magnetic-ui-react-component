import { useEffect, useRef, useState } from "react";

export function RadiusOverlay({
	radius,
	show,
}: {
	radius: number;
	show: boolean;
}) {
	const [pos, setPos] = useState({ x: -9999, y: -9999 });
	const areaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleMove = (e: MouseEvent) => {
			if (!areaRef.current) return;
			const rect = areaRef.current.getBoundingClientRect();
			setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
		};
		window.addEventListener("mousemove", handleMove, { passive: true });
		return () => window.removeEventListener("mousemove", handleMove);
	}, []);

	return (
		<div
			ref={areaRef}
			className="absolute inset-0 overflow-hidden pointer-events-none"
		>
			{show && (
				<div
					className="absolute rounded-full border-2 bg-radial from-background/50 to-transparent border-foreground/5 shadow-lg pointer-events-none"
					style={{
						position: "absolute",
						left: pos.x - radius,
						top: pos.y - radius,
						width: radius * 2,
						height: radius * 2,
						borderRadius: "50%",
						border: "1px dashed rgba(167,139,250,0.25)",
						transition: "width 0.15s, height 0.15s, left 0.05s, top 0.05s",
						pointerEvents: "none",
						// TODO: test this
						// left: pos.x - radius / 1.4,
						// top: pos.y - radius / 1.4,
						// width: radius / 0.7,
						// height: radius / 0.7,
						// TODO: maybe is nicer with this below?
						// maskImage:
						// 	"radial-gradient(circle at center, transparent, black 90%)",
					}}
				/>
			)}
		</div>
	);
}
