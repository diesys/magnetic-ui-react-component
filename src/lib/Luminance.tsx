/**
 * Luminance.tsx
 *
 * A zero-dependency React wrapper component that applies lighting effects
 * (reflection, glow, border) based on mouse proximity.
 *
 * Uses hybrid approach: DIV for reflection gradients, SVG filters for glow.
 * All effects applied via requestAnimationFrame to avoid React re-renders.
 *
 * Usage:
 *   <Luminance reflection glow border>
 *     <button>Hover me</button>
 *   </Luminance>
 */

import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";

// ─── Idle detection thresholds ─────────────────────────────────────────────────

const IDLE_DELTA_THRESHOLD = 0.01;
const IDLE_VELOCITY_THRESHOLD = 0.001;

// ─── Public Types ─────────────────────────────────────────────────────────────

export type ReflectionType = "linear" | "radial" | "conic";
export type GlowType = "internal" | "external";
export type BorderVariant = "deactivate" | "activate";

export interface LuminanceProps {
	children: ReactNode;

	// ── Core ──────────────────────────────────────────────────────────────
	/** Disable all effects (smoothly returns to rest). Default: false */
	disabled?: boolean;

	// ── Spring physics ────────────────────────────────────────────────────
	/** Enable spring-based smoothing. Default: true */
	spring?: boolean;
	/** Spring stiffness [0–1]. Default: 0.15 */
	springStiffness?: number;
	/** Spring damping [0–1]. Default: 0.25 */
	springDamping?: number;

	// ── Reflection (overlay gradient) ─────────────────────────────────────
	/** Enable reflection effect. Default: true */
	reflectionEnabled?: boolean;
	/** Gradient type. Default: 'linear' */
	reflectionType?: ReflectionType;
	/** Angle in degrees for linear/conic. Default: 90 */
	reflectionAngle?: number;
	/** X position % for radial/conic center. Default: 50 */
	reflectionPositionX?: number;
	/** Y position % for radial/conic center. Default: 50 */
	reflectionPositionY?: number;
	/** First color (at step1). Default: '#ffffff' */
	reflectionColorStart?: string;
	/** Second color (at step2). Default: 'transparent' */
	reflectionColorEnd?: string;
	/** First stop position % [0–100]. Default: 0 */
	reflectionStep1?: number;
	/** Second stop position % [0–100]. Default: 50 */
	reflectionStep2?: number;
	/** Reflection intensity/opacity [0–1]. Default: 0.8 */
	reflectionIntensity?: number;
	/** Reflection blur/softness. Default: 30 */
	reflectionBlur?: number;
	/** Reflection size multiplier. Default: 1.5 */
	reflectionSize?: number;

	// ── Glow (SVG filter) ─────────────────────────────────────────────────
	/** Enable glow effect. Default: false */
	glowEnabled?: boolean;
	/** Glow type: internal (inset) or external. Default: 'external' */
	glowType?: GlowType;
	/** Glow color. Default: '#ffffff' */
	glowColor?: string;
	/** Glow blur radius. Default: 20 */
	glowBlur?: number;
	/** Glow intensity [0–1]. Default: 0.8 */
	glowIntensity?: number;
	/** Glow spread. Default: 5 */
	glowSpread?: number;

	// ── Border (dynamic border) ──────────────────────────────────────────
	/** Enable border effect. Default: false */
	borderEnabled?: boolean;
	/** Border variant. Default: 'activate' */
	borderVariant?: BorderVariant;
	/** Border color. Default: '#ffffff' */
	borderColor?: string;
	/** Border width in px. Default: 2 */
	borderWidth?: number;
	/** Border intensity [0–1]. Default: 1 */
	borderIntensity?: number;

	// ── Wrapper ───────────────────────────────────────────────────────────
	/** Optional className applied to the wrapper div */
	className?: string;
	/** Optional style applied to the wrapper div */
	style?: CSSProperties;
}

// ─── Internal animated state ──────────────────────────────────────────────────

interface AnimState {
	/** Mouse X relative to element center (normalized -1 to 1) */
	mx: number;
	/** Mouse Y relative to element center (normalized -1 to 1) */
	my: number;
	/** Distance from center (normalized 0 to 1) */
	dist: number;
	/** Reflection opacity */
	refOpacity: number;
	/** Reflection position X % */
	refX: number;
	/** Reflection position Y % */
	refY: number;
	/** Glow opacity */
	glowOpacity: number;
	/** Border opacity */
	borderOpacity: number;
}

const REST_STATE: AnimState = {
	mx: 0,
	my: 0,
	dist: 0,
	refOpacity: 0,
	refX: 50,
	refY: 50,
	glowOpacity: 0,
	borderOpacity: 0,
};

type AnimVelocity = Record<keyof AnimState, number>;

function zeroVelocity(): AnimVelocity {
	return {
		mx: 0,
		my: 0,
		dist: 0,
		refOpacity: 0,
		refX: 0,
		refY: 0,
		glowOpacity: 0,
		borderOpacity: 0,
	};
}

// ─── Target state computation ─────────────────────────────────────────────────

function computeTarget(
	dx: number,
	dy: number,
	d: number,
	elWidth: number,
	elHeight: number,
	props: LuminanceProps,
): AnimState {
	const {
		disabled = false,
		reflectionEnabled = true,
		reflectionIntensity = 0.8,
		glowEnabled = false,
		glowIntensity = 0.8,
		borderEnabled = false,
		borderVariant = "activate",
		borderIntensity = 1,
	} = props;

	if (disabled) return { ...REST_STATE };

	// Normalize coordinates to -1 to 1 range
	const nx = dx / (elWidth / 2);
	const ny = dy / (elHeight / 2);
	const dist = Math.min(1, d / Math.max(elWidth, elHeight));

	// Reflection: opacity based on distance
	const refOp = reflectionEnabled ? (1 - dist) * reflectionIntensity : 0;

	// Glow: same as reflection but separate control
	const glOp = glowEnabled ? (1 - dist) * glowIntensity : 0;

	// Border: varies based on variant
	let bdOp = 0;
	if (borderEnabled) {
		if (borderVariant === "activate") {
			bdOp = (1 - dist) * borderIntensity;
		} else {
			bdOp = dist * borderIntensity;
		}
	}

	// Reflection position follows mouse (clamped to element bounds)
	const refX = 50 + nx * 50;
	const refY = 50 + ny * 50;

	return {
		mx: nx,
		my: ny,
		dist,
		refOpacity: refOp,
		refX,
		refY,
		glowOpacity: glOp,
		borderOpacity: bdOp,
	};
}

// ─── CSS string builders ──────────────────────────────────────────────────────

function buildReflection(
	type: ReflectionType,
	angle: number,
	x: number,
	y: number,
	colorStart: string,
	colorEnd: string,
	step1: number,
	step2: number,
	// TODO: needed?
	_size: number,
): string {
	const stops = `${colorStart} ${step1}%, ${colorEnd} ${step2}%`;

	switch (type) {
		case "linear": {
			return `linear-gradient(${angle}deg, ${stops})`;
		}
		case "radial": {
			return `radial-gradient(circle at ${x}% ${y}%, ${stops})`;
		}
		case "conic": {
			return `conic-gradient(from ${angle}deg at ${x}% ${y}%, ${stops})`;
		}
		default:
			return `linear-gradient(${angle}deg, ${stops})`;
	}
}

// ─── Luminance Component ─────────────────────────────────────────────────────

export function Luminance({
	children,
	disabled = false,
	spring = true,
	springStiffness = 0.15,
	springDamping = 0.25,
	reflectionEnabled = true,
	reflectionType = "linear",
	reflectionAngle = 90,
	reflectionPositionX = 50,
	reflectionPositionY = 50,
	reflectionColorStart = "#ffffff",
	reflectionColorEnd = "transparent",
	reflectionStep1 = 0,
	reflectionStep2 = 50,
	reflectionIntensity = 0.8,
	reflectionBlur = 30,
	reflectionSize = 1.5,
	glowEnabled = false,
	glowType = "external",
	glowColor = "#ffffff",
	glowBlur = 20,
	glowIntensity = 0.8,
	glowSpread = 5,
	borderEnabled = false,
	borderVariant = "activate",
	borderColor = "#ffffff",
	borderWidth = 2,
	borderIntensity = 1,
	className,
	style,
}: LuminanceProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const reflectionRef = useRef<HTMLDivElement>(null);
	const borderRef = useRef<HTMLDivElement>(null);
	const svgFilterRef = useRef<SVGFilterElement>(null);
	const [hasGlow, setHasGlow] = useState(false);

	const mouseRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef<AnimState>({ ...REST_STATE });
	const velRef = useRef<AnimVelocity>(zeroVelocity());
	const sleepingRef = useRef(false);

	// Determine if we need SVG filter (external glow needs it)
	// TODO: needed?
	const _needsSVG = glowEnabled && glowType === "external";

	const propsRef = useRef<LuminanceProps>({
		disabled,
		spring,
		springStiffness,
		springDamping,
		reflectionEnabled,
		reflectionType,
		reflectionAngle,
		reflectionPositionX,
		reflectionPositionY,
		reflectionColorStart,
		reflectionColorEnd,
		reflectionStep1,
		reflectionStep2,
		reflectionIntensity,
		reflectionBlur,
		reflectionSize,
		glowEnabled,
		glowType,
		glowColor,
		glowBlur,
		glowIntensity,
		glowSpread,
		borderEnabled,
		borderVariant,
		borderColor,
		borderWidth,
		borderIntensity,
		children,
	});

	propsRef.current = {
		disabled,
		spring,
		springStiffness,
		springDamping,
		reflectionEnabled,
		reflectionType,
		reflectionAngle,
		reflectionPositionX,
		reflectionPositionY,
		reflectionColorStart,
		reflectionColorEnd,
		reflectionStep1,
		reflectionStep2,
		reflectionIntensity,
		reflectionBlur,
		reflectionSize,
		glowEnabled,
		glowType,
		glowColor,
		glowBlur,
		glowIntensity,
		glowSpread,
		borderEnabled,
		borderVariant,
		borderColor,
		borderWidth,
		borderIntensity,
		children,
	};

	useEffect(() => {
		setHasGlow(glowEnabled && glowType === "external");
	}, [glowEnabled, glowType]);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current = { x: e.clientX, y: e.clientY };
			sleepingRef.current = false;
		};
		window.addEventListener("mousemove", handleMouseMove, { passive: true });

		let rafId: number;

		const animate = () => {
			const el = wrapperRef.current;
			const refEl = reflectionRef.current;
			const borderEl = borderRef.current;

			if (el) {
				const props = propsRef.current;
				const cur = currentRef.current;
				const vel = velRef.current;

				const rect = el.getBoundingClientRect();
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				const dx = mouseRef.current.x - cx;
				const dy = mouseRef.current.y - cy;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const target = computeTarget(
					dx,
					dy,
					distance,
					rect.width,
					rect.height,
					props,
				);

				const keys = Object.keys(cur) as (keyof AnimState)[];
				const maxDist = Math.max(rect.width, rect.height);
				const normalizedDist = distance / maxDist;
				let isIdle = normalizedDist > 1;

				if (isIdle) {
					for (const k of keys) {
						const delta = Math.abs(target[k] - cur[k]);
						const velocity = Math.abs(vel[k]);
						if (
							delta > IDLE_DELTA_THRESHOLD ||
							velocity > IDLE_VELOCITY_THRESHOLD
						) {
							isIdle = false;
							break;
						}
					}
				}

				if (isIdle) {
					sleepingRef.current = true;
					rafId = requestAnimationFrame(animate);
					return;
				}

				if (props.spring) {
					const stiffness = props.springStiffness ?? 0.15;
					const damping = props.springDamping ?? 0.25;

					for (const k of keys) {
						vel[k] += (target[k] - cur[k]) * stiffness;
						vel[k] *= damping;
						cur[k] += vel[k];
					}
				} else {
					for (const k of keys) cur[k] = target[k];
				}

				// Apply reflection
				if (refEl && props.reflectionEnabled) {
					const refSize = (props.reflectionSize ?? 1.5) * 100;
					refEl.style.width = `${refSize}%`;
					refEl.style.height = `${refSize}%`;
					refEl.style.left = `${cur.refX - refSize / 2}%`;
					refEl.style.top = `${cur.refY - refSize / 2}%`;
					refEl.style.opacity = String(cur.refOpacity);
					refEl.style.filter = `blur(${props.reflectionBlur ?? 30}px)`;
					refEl.style.pointerEvents = "none";
				}

				// Apply glow
				if (props.glowEnabled) {
					if (props.glowType === "internal") {
						el.style.boxShadow =
							cur.glowOpacity > 0
								? `inset 0 0 ${props.glowBlur ?? 20}px ${props.glowSpread ?? 5}px ${props.glowColor ?? "#ffffff"}`
								: "none";
					} else {
						el.style.boxShadow =
							cur.glowOpacity > 0
								? `0 0 ${props.glowBlur ?? 20}px ${props.glowSpread ?? 5}px ${props.glowColor ?? "#ffffff"}`
								: "none";
					}
				}

				// Apply border
				if (borderEl && props.borderEnabled) {
					borderEl.style.opacity = String(cur.borderOpacity);
				}
			}

			rafId = requestAnimationFrame(animate);
		};

		rafId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(rafId);
		};
	}, []);

	// Build reflection gradient
	const reflectionGradient = buildReflection(
		reflectionType,
		reflectionAngle,
		reflectionPositionX,
		reflectionPositionY,
		reflectionColorStart,
		reflectionColorEnd,
		reflectionStep1,
		reflectionStep2,
		reflectionSize,
	);

	return (
		<div
			ref={wrapperRef}
			className={`relative ${className ?? ""}`}
			style={{
				position: "relative",
				...style,
			}}
		>
			{/* Glow SVG Filter (external only) */}
			{hasGlow && (
				// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
				<svg
					className="absolute w-0 h-0"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					role="img"
				>
					<defs>
						<filter
							ref={svgFilterRef}
							id="luminance-glow"
							x="-50%"
							y="-50%"
							width="200%"
							height="200%"
						>
							<feGaussianBlur
								stdDeviation={(glowBlur ?? 20) / 2}
								result="coloredBlur"
							/>
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
				</svg>
			)}

			{/* Border overlay */}
			<div
				ref={borderRef}
				className="absolute inset-0 pointer-events-none -m-[1px]"
				style={{
					borderWidth: borderWidth ?? 2,
					borderColor: borderColor ?? "#ffffff",
					borderStyle: "solid",
					borderRadius: "inherit",
					transition: "opacity 0.1s",
					opacity: 0,
					filter: hasGlow ? "url(#luminance-glow)" : undefined,
				}}
			/>

			{/* Reflection overlay */}
			<div
				ref={reflectionRef}
				className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
				style={{
					background: reflectionGradient,
					transition: "opacity 0.05s",
					opacity: 0,
					zIndex: 10,
				}}
			/>

			{/* Child content */}
			{children}
		</div>
	);
}
