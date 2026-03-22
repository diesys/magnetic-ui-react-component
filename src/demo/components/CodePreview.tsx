import { useRef, useState } from "react";
import type { LuminanceProps } from "../../lib/Luminance";
import type { MagneticProps } from "../../lib/Magnetic";
import { LUMINANCE_DEFAULTS, MAGNETIC_DEFAULTS } from "../magneticConfig";
import { useUI } from "./context/AppContext";
import { Toggle } from "./Toggle";

type ConfigKey = keyof Omit<MagneticProps, "children" | "className" | "style">;
type LuminanceConfigKey = keyof Omit<
	LuminanceProps,
	"children" | "className" | "style"
>;

interface CodePreviewProps {
	magneticConfig: MagneticProps;
	luminanceConfig: LuminanceProps;
}

export function CodePreview({
	magneticConfig = MAGNETIC_DEFAULTS,
	luminanceConfig = LUMINANCE_DEFAULTS,
}: CodePreviewProps) {
	const [dim, setDim] = useState(true);
	const [hideDefaults, setHideDefaults] = useState(false);
	const [copied, setCopied] = useState(false);
	const preRef = useRef<HTMLPreElement>(null);

	const { uiState } = useUI();

	const copySnippet = async () => {
		const text = preRef.current?.textContent ?? "";
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			const ta = document.createElement("textarea");
			ta.value = text;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand("copy");
			document.body.removeChild(ta);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	const configKeys = Object.keys(MAGNETIC_DEFAULTS).filter(
		(k): k is ConfigKey =>
			k !== "children" && k !== "className" && k !== "style",
	);

	const luminanceKeys = Object.keys(LUMINANCE_DEFAULTS).filter(
		(k): k is LuminanceConfigKey =>
			k !== "children" && k !== "className" && k !== "style",
	);

	const isDefaultValue = (key: ConfigKey) =>
		magneticConfig[key] === MAGNETIC_DEFAULTS[key];

	const isLuminanceDefaultValue = (key: LuminanceConfigKey) =>
		luminanceConfig[key] === LUMINANCE_DEFAULTS[key];

	const renderProp = (key: ConfigKey) => {
		const value = magneticConfig[key];
		if (value === undefined || value === null) return null;
		const isDefault = (dim || hideDefaults) && isDefaultValue(key);
		const formatted = typeof value === "string" ? `"${value}"` : String(value);
		return (
			<span
				key={key}
				className={isDefault ? (hideDefaults ? "hidden" : "opacity-50") : ""}
			>
				<br />
				{"  "}
				<span className="text-mode brightness-110 saturate-50">{key}</span>=
				{"{"} <span className="text-mode brightness-300">{formatted}</span>{" "}
				{"}"}
			</span>
		);
	};

	const renderLuminanceProp = (key: LuminanceConfigKey) => {
		const value = luminanceConfig[key];
		if (value === undefined || value === null) return null;
		const isDefault = (dim || hideDefaults) && isLuminanceDefaultValue(key);
		const formatted = typeof value === "string" ? `"${value}"` : String(value);
		return (
			<span
				key={key}
				className={isDefault ? (hideDefaults ? "hidden" : "opacity-50") : ""}
			>
				<br />
				{"  "}
				<span className="text-mode brightness-110 saturate-50">{key}</span>=
				{"{"} <span className="text-mode brightness-300">{formatted}</span>{" "}
				{"}"}
			</span>
		);
	};

	const showPreview = (component: "Luminance" | "Magnetic") => {
		return (
			<>
				{`<${component}`}
				{component === "Magnetic" && configKeys.map(renderProp)}
				{component === "Luminance" && luminanceKeys.map(renderLuminanceProp)}
				{`>`}
				<span className="opacity-60">{`
  { children }
`}</span>
				{`</${component}>`}
			</>
		);
	};

	return (
		<>
			{/* Toggle Controls */}
			<div className="relative w-full mb-1">
				<button
					aria-label="Copy props to clipboard"
					onClick={copySnippet}
					type="button"
					className="absolute top-2 right-2 text-xs px-2 py-1 rounded border border-foreground/20 bg-background/60 hover:bg-background/90"
				>
					Copy
				</button>

				<pre
					ref={preRef}
					className="text-[10px] rounded-md p-3 overflow-x-auto leading-relaxed whitespace-pre-wrap text-foreground/60 bg-foreground/5 border border-foreground/10"
				>
					{uiState.magneticEnabled && (
						<>
							{showPreview("Magnetic")}
							<br />
						</>
					)}
					{uiState.luminanceEnabled && (
						<>
							<br />
							{showPreview("Luminance")}
						</>
					)}
				</pre>
				{copied && (
					<span className="absolute top-10 right-2 text-xs text-mode brightness-200 bg-surface/80 p-0.5">
						Copied!
					</span>
				)}
			</div>

			{/* Toggles */}
			<div className="flex flex-col justify-start text-xs gap-4">
				<Toggle
					label="Hide defaults"
					value={hideDefaults}
					onChange={setHideDefaults}
				/>
				{!hideDefaults && (
					<Toggle label="Dim defaults" value={dim} onChange={setDim} />
				)}
			</div>
		</>
	);
}
