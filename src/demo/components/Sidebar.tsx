import { useState } from "react";
import type {
	BorderVariant,
	GlowType,
	LuminanceProps,
	ReflectionType,
} from "../../lib/Luminance";
import type {
	FalloffType,
	MagneticModeType,
	MagneticProps,
} from "../../lib/Magnetic";
import {
	LUMINANCE_DEFAULTS,
	type LuminanceProps as LuminancePropsType,
	MAGNETIC_DEFAULTS,
} from "../magneticConfig";
import { CodePreview } from "./CodePreview";
import { useUI } from "./context/AppContext";
import { EffectControl } from "./EffectControl";
import { Section } from "./Section";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Toggle } from "./Toggle";

type Mode = {
	name: string;
	icon: string;
	mode?: MagneticModeType;
};

const attract: Mode = {
	name: "Attract",
	icon: "⊕",
	mode: "attract",
};
const repel: Mode = {
	name: "Repel",
	icon: "⊖",
	mode: "repel",
};
const disabled: Mode = {
	name: "Disabled",
	icon: "⊗",
	mode: undefined,
};

// Helper to dynamically switch CSS --mode var based on "magnetic" or "luminance" activation
function updateCssModeVars(
	magneticEnabled: boolean,
	magneticMode: MagneticModeType | undefined,
	luminanceEnabled: boolean,
) {
	const modeVar = `color-mix(in oklch, var(--magnetic-mode) ${magneticEnabled || magneticMode ? "100%" : "0%"}, var(--luminance-mode) ${luminanceEnabled ? "100%" : "0%"})`;

	document.documentElement.style.setProperty(
		"--magnetic-mode",
		`{var(--magnetic-mode-${magneticMode ?? "disabled"})}`,
	);
	document.documentElement.style.setProperty(
		"--luminance-mode",
		`var(--luminance-mode-${luminanceEnabled ? "enabled" : "disabled"})`,
	);
	document.documentElement.style.setProperty("--mode", modeVar);
	console.log(modeVar);
}

export const MODES = [disabled, attract, repel];

export interface SidebarProps {
	magneticConfig: MagneticProps;
	luminanceConfig: LuminancePropsType;
	setMagneticConfig: React.Dispatch<React.SetStateAction<MagneticProps>>;
	setLuminanceConfig: React.Dispatch<React.SetStateAction<LuminancePropsType>>;
	visible?: boolean;
}

export function Sidebar({
	magneticConfig = MAGNETIC_DEFAULTS,
	luminanceConfig = LUMINANCE_DEFAULTS,
	setMagneticConfig,
	setLuminanceConfig,
	// visible = true,
}: SidebarProps) {
	const [isDisabled] = useState(magneticConfig.disabled);
	const { uiState, setShowRadius, setMagneticEnabled, setLuminanceEnabled } =
		useUI();

	const set = <K extends keyof MagneticProps>(
		key: K,
		value: MagneticProps[K],
	) => setMagneticConfig((prev) => ({ ...prev, [key]: value }));

	const setLum = <K extends keyof LuminanceProps>(
		key: K,
		value: LuminanceProps[K],
	) => setLuminanceConfig((prev) => ({ ...prev, [key]: value }));

	return (
		<aside className="w-68 overflow-y-auto flex max-h-full flex-col p-4 border-l border-foreground/5 bg-background">
			{/* TOOLBAR */}
			<div className="flex flex-wrap gap-1.5 sticky -top-2 z-20 -mx-0.5">
				<button
					type="button"
					onClick={() => setShowRadius(!uiState.showRadius)}
					className={uiState.showRadius ? "active" : ""}
				>
					{uiState.showRadius ? `Hide` : `Show`} radius
				</button>
				<button
					type="button"
					title="Reset"
					onClick={() => {
						document.documentElement.style.setProperty("--mode", null);
						setMagneticConfig(MAGNETIC_DEFAULTS);
						setLuminanceConfig(LUMINANCE_DEFAULTS);
					}}
				>
					↺
				</button>
			</div>

			{/* MAGNETIC SECTION */}
			{uiState.enabledFeatures.includes("magnetic") && (
				<Section
					title="Magnetic"
					tooltip="Magnetic interaction controls"
					defaultOpen={uiState.magneticEnabled}
				>
					<div
						className={`flex flex-col gap-3 ${
							uiState.magneticEnabled
								? `magnetic-mode-${magneticConfig.mode}`
								: "magnetic-mode-disabled"
						}`}
					>
						{/* MAGNETIC MODES SWITCH */}
						<span className="flex gap-[inherit] w-full">
							{MODES.map((item) => {
								const isActive = isDisabled
									? item.mode === undefined
									: item.mode === magneticConfig.mode;

								return (
									<button
										data-mode-toggle
										type="button"
										key={item.name}
										title={item.name}
										className={isActive ? "active" : undefined}
										onClick={() => {
											updateCssModeVars(
												uiState.magneticEnabled,
												uiState.magneticMode,
												uiState.luminanceEnabled,
											);
											// Update self color mappedi with loop
											document.documentElement.style.setProperty(
												"--magnetic-mode",
												`var(--mode-${item.mode && !isDisabled ? item.mode : "disabled"})`,
											);
											setMagneticConfig((prev) => ({
												...prev,
												disabled: isDisabled,
												mode: isDisabled ? undefined : (item.mode ?? undefined),
											}));
											// uiState.magneticEnabled = !isDisabled;
											setMagneticEnabled(!(isDisabled || !item.mode));
										}}
									>
										{item.name}
									</button>
								);
							})}
						</span>

						<Select
							label=""
							value={magneticConfig.falloff ?? "quadratic"}
							options={[
								{ value: "linear", label: "Linear — clean" },
								{ value: "quadratic", label: "Quadratic — smooth" },
								{ value: "inverse", label: "Inverse — gravity-like" },
								{ value: "exponential", label: "Exponential — always on" },
							]}
							onChange={(v) => set("falloff", v as FalloffType)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<Slider
							label="Radius (px)"
							value={magneticConfig.radius ?? 0}
							min={30}
							max={500}
							step={1}
							onChange={(v) => set("radius", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<Toggle
							label="Spring"
							value={magneticConfig.spring ?? true}
							onChange={(v) => set("spring", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>
						<div
							className="overflow-hidden transition-all duration-200 flex flex-col gap-3 pb-2"
							style={{
								maxHeight:
									magneticConfig.spring &&
									!isDisabled &&
									uiState.magneticEnabled
										? "200px"
										: "0px",
								opacity:
									magneticConfig.spring &&
									!isDisabled &&
									uiState.magneticEnabled
										? 1
										: 0,
							}}
						>
							<Slider
								label="Stiffness"
								value={magneticConfig.springStiffness ?? 0.15}
								min={0.01}
								max={0.6}
								step={0.01}
								onChange={(v) => set("springStiffness", v)}
							/>
							<Slider
								label="Damping"
								value={magneticConfig.springDamping ?? 0.25}
								min={0.1}
								max={0.99}
								step={0.01}
								onChange={(v) => set("springDamping", v)}
							/>
						</div>

						<EffectControl
							label="Translate"
							enabled={magneticConfig.translate ?? true}
							onToggle={(v) => set("translate", v)}
							value={magneticConfig.moveIntensity ?? 40}
							min={0}
							max={120}
							step={1}
							onChange={(v) => set("moveIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<EffectControl
							label="Rotate"
							enabled={magneticConfig.rotate ?? false}
							onToggle={(v) => set("rotate", v)}
							value={magneticConfig.rotateIntensity ?? 15}
							min={0}
							max={45}
							step={0.5}
							onChange={(v) => set("rotateIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<EffectControl
							label="Tilt"
							enabled={magneticConfig.tilt ?? false}
							onToggle={(v) => set("tilt", v)}
							value={magneticConfig.tiltIntensity ?? 15}
							min={0}
							max={45}
							step={0.5}
							onChange={(v) => set("tiltIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						>
							<Slider
								label="Distance"
								value={magneticConfig.perspective ?? 800}
								min={100}
								max={2000}
								step={10}
								onChange={(v) => set("perspective", v)}
							/>
						</EffectControl>

						<EffectControl
							label="Opacity"
							enabled={magneticConfig.opacity ?? false}
							onToggle={(v) => set("opacity", v)}
							value={magneticConfig.opacityIntensity ?? 0.4}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => set("opacityIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<EffectControl
							label="Skew"
							enabled={magneticConfig.skew ?? false}
							onToggle={(v) => set("skew", v)}
							value={magneticConfig.skewIntensity ?? 10}
							min={0}
							max={30}
							step={0.5}
							onChange={(v) => set("skewIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<EffectControl
							label="Stretch"
							enabled={magneticConfig.stretch ?? false}
							onToggle={(v) => set("stretch", v)}
							value={magneticConfig.stretchIntensity ?? 0.3}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => set("stretchIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>

						<EffectControl
							label="Scale"
							enabled={magneticConfig.scale ?? false}
							onToggle={(v) => set("scale", v)}
							value={magneticConfig.scaleIntensity ?? 0.2}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => set("scaleIntensity", v)}
							dimmed={isDisabled || !uiState.magneticEnabled}
						/>
					</div>
				</Section>
			)}

			{/* LUMINANCE SECTION */}
			{uiState.enabledFeatures.includes("luminance") && (
				<Section
					title="Luminance"
					tooltip="Lighting and glow effects"
					defaultOpen={uiState.luminanceEnabled}
				>
					<div
						className={`flex flex-col gap-3 ${
							uiState.luminanceEnabled
								? "luminance-mode-enabled"
								: "luminance-mode-disabled"
						}`}
					>
						<span className="flex gap-1 w-full">
							<button
								type="button"
								title="Disable luminance"
								className={
									uiState.luminanceEnabled
										? ""
										: "text-luminance-mode-disabled active"
								}
								onClick={() => {
									setLuminanceEnabled(false);
									// document.documentElement.style.setProperty(
									// 	"--mode",
									updateCssModeVars(
										uiState.magneticEnabled,
										uiState.magneticMode,
										uiState.luminanceEnabled,
									);
									// );
									// document.documentElement.style.setProperty(
									// 	"--luminance-mode",
									// 	"var(--mode-disabled)",
									// );
								}}
							>
								Disabled
							</button>
							<button
								type="button"
								title="Enable luminance"
								className={
									uiState.luminanceEnabled
										? "text-luminance-mode-enabled active"
										: ""
								}
								onClick={() => {
									setLuminanceEnabled(true);
									// document.documentElement.style.setProperty(
									// 	"--luminance-mode",
									// 	"var(--mode-enabled)",
									// );
								}}
							>
								Enabled
							</button>
						</span>
						<Toggle
							label="Spring"
							value={luminanceConfig.spring ?? true}
							onChange={(v) => setLum("spring", v)}
							dimmed={!uiState.luminanceEnabled}
						/>
						<div
							className="overflow-hidden transition-all duration-200 flex flex-col gap-3 pb-2"
							style={{
								maxHeight:
									luminanceConfig.spring && uiState.luminanceEnabled
										? "200px"
										: "0px",
								opacity:
									luminanceConfig.spring && uiState.luminanceEnabled ? 1 : 0,
							}}
						>
							<Slider
								label="Stiffness"
								value={luminanceConfig.springStiffness ?? 0.15}
								min={0.01}
								max={0.6}
								step={0.01}
								onChange={(v) => setLum("springStiffness", v)}
							/>
							<Slider
								label="Damping"
								value={luminanceConfig.springDamping ?? 0.25}
								min={0.1}
								max={0.99}
								step={0.01}
								onChange={(v) => setLum("springDamping", v)}
							/>
						</div>

						{/* Reflection */}
						<EffectControl
							label="Reflection"
							enabled={luminanceConfig.reflectionEnabled ?? true}
							onToggle={(v) => setLum("reflectionEnabled", v)}
							value={luminanceConfig.reflectionIntensity ?? 0.8}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => setLum("reflectionIntensity", v)}
							dimmed={!uiState.luminanceEnabled}
						>
							<Select
								label="Type"
								value={luminanceConfig.reflectionType ?? "linear"}
								options={[
									{ value: "linear", label: "Linear" },
									{ value: "radial", label: "Radial" },
									{ value: "conic", label: "Conic" },
								]}
								onChange={(v) => setLum("reflectionType", v as ReflectionType)}
							/>
							{(luminanceConfig.reflectionType === "linear" ||
								luminanceConfig.reflectionType === "conic") && (
								<Slider
									label="Angle"
									value={luminanceConfig.reflectionAngle ?? 90}
									min={0}
									max={360}
									step={1}
									onChange={(v) => setLum("reflectionAngle", v)}
								/>
							)}
							{(luminanceConfig.reflectionType === "radial" ||
								luminanceConfig.reflectionType === "conic") && (
								<>
									<Slider
										label="Pos X"
										value={luminanceConfig.reflectionPositionX ?? 50}
										min={0}
										max={100}
										step={1}
										onChange={(v) => setLum("reflectionPositionX", v)}
									/>
									<Slider
										label="Pos Y"
										value={luminanceConfig.reflectionPositionY ?? 50}
										min={0}
										max={100}
										step={1}
										onChange={(v) => setLum("reflectionPositionY", v)}
									/>
								</>
							)}
							<Slider
								label="Blur"
								value={luminanceConfig.reflectionBlur ?? 30}
								min={0}
								max={100}
								step={1}
								onChange={(v) => setLum("reflectionBlur", v)}
							/>
							<Slider
								label="Size"
								value={(luminanceConfig.reflectionSize ?? 1.5) * 100}
								min={50}
								max={300}
								step={5}
								onChange={(v) => setLum("reflectionSize", v / 100)}
							/>
						</EffectControl>

						{/* Glow */}
						<EffectControl
							label="Glow"
							enabled={luminanceConfig.glowEnabled ?? false}
							onToggle={(v) => setLum("glowEnabled", v)}
							value={luminanceConfig.glowIntensity ?? 0.8}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => setLum("glowIntensity", v)}
							dimmed={!uiState.luminanceEnabled}
						>
							<Select
								label="Type"
								value={luminanceConfig.glowType ?? "external"}
								options={[
									{ value: "external", label: "External" },
									{ value: "internal", label: "Internal (inset)" },
								]}
								onChange={(v) => setLum("glowType", v as GlowType)}
							/>
							<Slider
								label="Blur"
								value={luminanceConfig.glowBlur ?? 20}
								min={0}
								max={100}
								step={1}
								onChange={(v) => setLum("glowBlur", v)}
							/>
							<Slider
								label="Spread"
								value={luminanceConfig.glowSpread ?? 5}
								min={0}
								max={50}
								step={1}
								onChange={(v) => setLum("glowSpread", v)}
							/>
						</EffectControl>

						{/* Border */}
						<EffectControl
							label="Border"
							enabled={luminanceConfig.borderEnabled ?? false}
							onToggle={(v) => setLum("borderEnabled", v)}
							value={luminanceConfig.borderIntensity ?? 1}
							min={0}
							max={1}
							step={0.01}
							onChange={(v) => setLum("borderIntensity", v)}
							dimmed={!uiState.luminanceEnabled}
						>
							<Select
								label="Variant"
								value={luminanceConfig.borderVariant ?? "activate"}
								options={[
									{ value: "activate", label: "Off → On (hover)" },
									{ value: "deactivate", label: "On → Off (hover)" },
								]}
								onChange={(v) => setLum("borderVariant", v as BorderVariant)}
							/>
							<Slider
								label="Width"
								value={luminanceConfig.borderWidth ?? 2}
								min={1}
								max={10}
								step={0.5}
								onChange={(v) => setLum("borderWidth", v)}
							/>
						</EffectControl>
					</div>
				</Section>
			)}

			{/* CODE PREVIEW */}
			{(uiState.magneticEnabled || uiState.luminanceEnabled) && (
				<Section
					title="Code"
					tooltip="Live JSX snippet — copy and paste into your project"
					defaultOpen={false}
				>
					<CodePreview {...{ magneticConfig, luminanceConfig }} />
				</Section>
			)}
		</aside>
	);
}
