/**
 * Magnetic.tsx
 *
 * A zero-dependency React wrapper component that applies physics-inspired
 * magnetic/gravitational effects (attract or repel) based on mouse proximity.
 *
 * All transforms are applied directly to the DOM via requestAnimationFrame
 * to avoid React re-renders on every frame.
 *
 * Usage:
 *   <Magnetic translate rotate tilt>
 *     <button>Hover me</button>
 *   </Magnetic>
 */

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

// ─── Idle detection thresholds ─────────────────────────────────────────────────

const IDLE_DELTA_THRESHOLD = 0.01;
const IDLE_VELOCITY_THRESHOLD = 0.001;

// ─── Public Types ─────────────────────────────────────────────────────────────

/** How the magnetic force decays with distance */
export type FalloffType = "linear" | "quadratic" | "inverse" | "exponential";

/**
 * attract → element moves toward the mouse (positive pull)
 * repel   → element moves away from the mouse (negative push)
 */
export type MagneticModeType = "attract" | "repel";

export interface MagneticProps {
	children: ReactNode;

	// ── Core ──────────────────────────────────────────────────────────────
	/** Activation radius in px. Beyond this, no effect (except 'exponential'). Default: 150 */
	radius?: number;
	/** Force decay curve with distance. Default: 'quadratic' */
	falloff?: FalloffType;
	/** Attraction or repulsion mode. Default: 'attract' */
	mode?: MagneticModeType;
	/** Disable all effects (smoothly returns to rest). Default: false */
	disabled?: boolean;

	// ── Move (translateX/Y) ───────────────────────────────────────────────
	/** Enable translate transform. Default: true */
	translate?: boolean;
	/** Max translation in px. Default: 40 */
	moveIntensity?: number;

	// ── Rotate (rotate) ───────────────────────────────────────────────────
	/** Enable rotation transform. Default: false */
	rotate?: boolean;
	/** Max rotation in degrees. Default: 15 */
	rotateIntensity?: number;

	// ── Skew (skewX/Y) ────────────────────────────────────────────────────
	/** Enable skew transform. Default: false */
	skew?: boolean;
	/** Max skew in degrees. Default: 10 */
	skewIntensity?: number;

	// ── Stretch (asymmetric scale along mouse axis) ───────────────────────
	/** Enable stretch (non-uniform scale along mouse direction). Default: false */
	stretch?: boolean;
	/** Max stretch factor (e.g. 0.3 = 30% extra on dominant axis). Default: 0.3 */
	stretchIntensity?: number;

	// ── Scale (uniform scale) ─────────────────────────────────────────────
	/** Enable uniform scale transform. Default: false */
	scale?: boolean;
	/**
	 * Max scale delta (e.g. 0.2 → scales up to 1.2× in attract, down to 0.8× in repel).
	 * Default: 0.2
	 */
	scaleIntensity?: number;

	// ── Tilt (3D rotateX/Y) ───────────────────────────────────────────────
	/** Enable 3D card-tilt effect (rotateX/Y). Default: false */
	tilt?: boolean;
	/** Max tilt angle in degrees. Default: 15 */
	tiltIntensity?: number;
	/** CSS perspective depth in px for 3D effects. Default: 800 */
	perspective?: number;

	// ── Opacity ───────────────────────────────────────────────────────────
	/** Enable opacity variation with proximity. Default: false */
	opacity?: boolean;
	/**
	 * Opacity intensity [0–1].
	 * At full force: opacity = 1 - force × opacityIntensity.
	 * E.g. 0.4 → dims to 0.6 at center. Default: 0.4
	 */
	opacityIntensity?: number;

	// ── Spring physics ────────────────────────────────────────────────────
	/** Enable spring-based smoothing (gives inertia + bounce). Default: true */
	spring?: boolean;
	/** Spring stiffness [0–1]. Higher = snappier. Default: 0.15 */
	springStiffness?: number;
	/** Spring damping [0–1]. Higher = less oscillation. Default: 0.25 */
	springDamping?: number;

	// ── Wrapper ───────────────────────────────────────────────────────────
	/** Optional className applied to the wrapper div */
	className?: string;
	/** Optional style applied to the wrapper div */
	style?: CSSProperties;
}

// ─── Internal animated state ──────────────────────────────────────────────────

interface AnimState {
	tx: number; // translateX in px
	ty: number; // translateY in px
	rotate: number; // rotation in deg
	skewX: number; // skewX in deg
	skewY: number; // skewY in deg
	scaleX: number; // stretch scale X (1 = no effect)
	scaleY: number; // stretch scale Y (1 = no effect)
	scale: number; // uniform scale (1 = no effect)
	rotateX: number; // 3D tilt X in deg
	rotateY: number; // 3D tilt Y in deg
	opacity: number; // opacity [0–1]
}

/** The resting / neutral state (no effect applied) */
const REST_STATE: AnimState = {
	tx: 0,
	ty: 0,
	rotate: 0,
	skewX: 0,
	skewY: 0,
	scaleX: 1,
	scaleY: 1,
	scale: 1,
	rotateX: 0,
	rotateY: 0,
	opacity: 1,
};

type AnimVelocity = Record<keyof AnimState, number>;

function zeroVelocity(): AnimVelocity {
	return {
		tx: 0,
		ty: 0,
		rotate: 0,
		skewX: 0,
		skewY: 0,
		scaleX: 0,
		scaleY: 0,
		scale: 0,
		rotateX: 0,
		rotateY: 0,
		opacity: 0,
	};
}

// ─── Force falloff ────────────────────────────────────────────────────────────

/**
 * Returns a force factor in [0, 1] given the current distance and radius.
 *
 * linear      → clean, predictable dropoff
 * quadratic   → softer near the edge, stronger near center
 * inverse     → Cauchy/Lorentzian shape; 1 at center, 0.5 at radius edge, never fully zero
 * exponential → always active, decays rapidly, ~0.018 at d = radius
 */
function computeFalloff(d: number, radius: number, type: FalloffType): number {
	// All types except exponential are clamped to zero beyond radius
	if (type !== "exponential" && d >= radius) return 0;

	switch (type) {
		case "linear":
			return 1 - d / radius;

		case "quadratic": {
			const t = 1 - d / radius;
			return t * t;
		}

		case "inverse":
			// 1 / (1 + (d/R)²) — smooth bell curve; naturally bounded
			return 1 / (1 + (d / radius) * (d / radius));

		case "exponential":
			// e^(-4d/R) — extends beyond radius but fades quickly
			return Math.exp((-4 * d) / radius);

		default:
			return 1 - d / radius;
	}
}

// ─── Target state computation ─────────────────────────────────────────────────

/**
 * Given the mouse offset (dx, dy) from the element center and the current props,
 * computes the target AnimState the spring should move toward.
 */
function computeTarget(
	dx: number,
	dy: number,
	d: number,
	props: MagneticProps,
): AnimState {
	const {
		radius = 150,
		falloff = "quadratic",
		mode = "attract",
		translate = true,
		moveIntensity = 40,
		rotate = false,
		rotateIntensity = 15,
		skew = false,
		skewIntensity = 10,
		stretch = false,
		stretchIntensity = 0.3,
		scale = false,
		scaleIntensity = 0.2,
		tilt = false,
		tiltIntensity = 15,
		opacity: opacityEnabled = false,
		opacityIntensity = 0.4,
	} = props;

	// Avoid division by zero when mouse is at center
	if (d < 0.5) return { ...REST_STATE };

	const force = computeFalloff(d, radius, falloff);

	// Normalized direction vector pointing from center → mouse
	const nx = dx / d;
	const ny = dy / d;

	// sign: attract = move toward mouse (+), repel = move away (-)
	const sign = mode === "attract" ? 1 : -1;

	// ── Move: translate along the mouse direction ────────────────────────
	const tx = translate ? sign * nx * force * moveIntensity : 0;
	const ty = translate ? sign * ny * force * moveIntensity : 0;

	// ── Rotate: lean toward/away from the mouse (X-axis component) ───────
	const rot = rotate ? sign * nx * force * rotateIntensity : 0;

	// ── Skew: shear deformation driven by the perpendicular axis ─────────
	//   skewX is controlled by the Y offset (horizontal shear from vertical pull)
	//   skewY is controlled by the X offset (vertical shear from horizontal pull)
	const skX = skew ? sign * ny * force * skewIntensity : 0;
	const skY = skew ? sign * nx * force * skewIntensity : 0;

	// ── Stretch: non-uniform scale along the dominant mouse axis ─────────
	//   Stretches the element along the direction the mouse is pulling/pushing
	const scX = stretch ? 1 + Math.abs(nx) * force * stretchIntensity : 1;
	const scY = stretch ? 1 + Math.abs(ny) * force * stretchIntensity : 1;

	// ── Scale: uniform scale (attract = grow, repel = shrink) ────────────
	const sc = scale ? 1 + sign * force * scaleIntensity : 1;

	// ── Tilt: 3D card effect — rotateX/Y based on mouse position ─────────
	//   rotateX tilts top/bottom based on vertical offset
	//   rotateY tilts left/right based on horizontal offset
	const rX = tilt ? -sign * ny * force * tiltIntensity : 0;
	const rY = tilt ? sign * nx * force * tiltIntensity : 0;

	// ── Opacity: dims (or varies) with proximity ─────────────────────────
	const op = opacityEnabled
		? Math.max(0, Math.min(1, 1 - force * (opacityIntensity ?? 0.4)))
		: 1;

	return {
		tx,
		ty,
		rotate: rot,
		skewX: skX,
		skewY: skY,
		scaleX: scX,
		scaleY: scY,
		scale: sc,
		rotateX: rX,
		rotateY: rY,
		opacity: op,
	};
}

// ─── CSS transform string builder ─────────────────────────────────────────────

/**
 * Combines all animated values into a single CSS transform string.
 * Scale and stretch are merged so they compose correctly.
 */
function buildTransform(cur: AnimState, perspective: number): string {
	// Combine uniform scale with per-axis stretch
	const finalScaleX = cur.scale * cur.scaleX;
	const finalScaleY = cur.scale * cur.scaleY;

	return [
		`perspective(${perspective}px)`,
		`translate(${cur.tx}px, ${cur.ty}px)`,
		`rotate(${cur.rotate}deg)`,
		`rotateX(${cur.rotateX}deg)`,
		`rotateY(${cur.rotateY}deg)`,
		`skew(${cur.skewX}deg, ${cur.skewY}deg)`,
		`scale(${finalScaleX}, ${finalScaleY})`,
	].join(" ");
}

// ─── Magnetic Component ───────────────────────────────────────────────────────

export function Magnetic({
	children,
	disabled = false,
	perspective = 800,
	spring = true,
	springStiffness = 0.15,
	springDamping = 0.25,
	className,
	style,
	...rest
}: MagneticProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const mouseRef = useRef({ x: 0, y: 0 });
	const currentRef = useRef<AnimState>({ ...REST_STATE });
	const velRef = useRef<AnimVelocity>(zeroVelocity());
	const sleepingRef = useRef(false);

	// Keep a ref to the latest props so the rAF loop always reads fresh values
	// without needing to re-subscribe useEffect every time a prop changes
	const propsRef = useRef<MagneticProps>({
		disabled,
		perspective,
		spring,
		springStiffness,
		springDamping,
		children,
		...rest,
	});
	propsRef.current = {
		disabled,
		perspective,
		spring,
		springStiffness,
		springDamping,
		children,
		...rest,
	};

	useEffect(() => {
		// Track mouse globally — this allows the effect to work even if the
		// mouse moves quickly out of the element bounds
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current = { x: e.clientX, y: e.clientY };
			sleepingRef.current = false;
		};
		window.addEventListener("mousemove", handleMouseMove, { passive: true });

		let rafId: number;

		const animate = () => {
			const el = wrapperRef.current;

			if (el) {
				const props = propsRef.current;
				const cur = currentRef.current;
				const vel = velRef.current;

				// Compute target state based on current mouse position
				let target: AnimState;
				let distance = 0;

				if (props.disabled) {
					// When disabled, target is always rest (spring will return smoothly)
					target = { ...REST_STATE };
				} else {
					const rect = el.getBoundingClientRect();
					const cx = rect.left + rect.width / 2;
					const cy = rect.top + rect.height / 2;
					const dx = mouseRef.current.x - cx;
					const dy = mouseRef.current.y - cy;
					distance = Math.sqrt(dx * dx + dy * dy);
					target = computeTarget(dx, dy, distance, props);
				}

				const radius = props.radius ?? 150;
				const keys = Object.keys(cur) as (keyof AnimState)[];
				let isIdle = distance >= radius;
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
					// Spring physics: each frame, velocity pulls current toward target
					// and is dampened to prevent infinite oscillation
					const stiffness = props.springStiffness ?? 0.15;
					const damping = props.springDamping ?? 0.25;

					for (const k of keys) {
						vel[k] += (target[k] - cur[k]) * stiffness; // spring force
						vel[k] *= damping; // energy loss
						cur[k] += vel[k]; // integrate
					}
				} else {
					for (const k of keys) cur[k] = target[k];
				}

				// Write transforms directly to the DOM — no React re-render needed
				el.style.transform = buildTransform(cur, props.perspective ?? 800);
				el.style.opacity = String(Math.max(0, Math.min(1, cur.opacity)));
			}

			rafId = requestAnimationFrame(animate);
		};

		rafId = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(rafId);
		};
	}, []); // Intentional empty deps — props read live via propsRef

	return (
		<div
			ref={wrapperRef}
			className={className}
			style={{
				display: "inline-block",
				willChange: "transform, opacity", // hint to browser for GPU compositing
				...style,
			}}
		>
			{children}
		</div>
	);
}
