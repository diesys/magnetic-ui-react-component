import { useState } from "react";
import { Luminance, type LuminanceProps } from "../lib/Luminance";
import { Magnetic, type MagneticProps } from "../lib/Magnetic";
import { Button } from "./components/Button";
import { Card } from "./components/Card";
import { AppProvider, useUI } from "./components/context/AppContext";
import { RadiusOverlay } from "./components/RadiusOverlay";
import { MODES, Sidebar, type SidebarProps } from "./components/Sidebar";
import { LUMINANCE_DEFAULTS, MAGNETIC_DEFAULTS } from "./magneticConfig";

function DemoContent() {
	const [magneticConfig, setMagneticConfig] =
		useState<MagneticProps>(MAGNETIC_DEFAULTS);
	const [luminanceConfig, setLuminanceConfig] =
		useState<LuminanceProps>(LUMINANCE_DEFAULTS);
	const [isDisabled] = useState(magneticConfig.disabled);

	// Get context
	const { uiState } = useUI();
	const isMagneticActive = uiState.magneticEnabled && !isDisabled;
	const isLuminanceActive = uiState.luminanceEnabled && !isDisabled;

	// Components' specific props to have a cleaner markup
	const magneticProps: MagneticProps = {
		...magneticConfig,
		disabled: !isMagneticActive,
	};
	const luminanceProps: LuminanceProps = {
		...luminanceConfig,
		disabled: !isLuminanceActive,
	};
	const sidebarProps: SidebarProps = {
		...{
			magneticConfig,
			luminanceConfig,
			setMagneticConfig,
			setLuminanceConfig,
		},
	};

	const children = (
		<>
			<header className="shrink-0 mt-10 min-w-80 relative">
				<h1 className="text-foreground/90 font-mono flex items-center gap-4 text-2xl font-semibold">
					{uiState.enabledFeatures.includes("magnetic") && (
						<>
							&lt;Magnetic
							<span className="flex bg-magnetic-mode/10 border-magnetic-mode/70 text-magnetic-mode border items-center gap-2 px-1.5 py-1 pr-2 uppercase font-sans rounded-full text-xs w-fit">
								{MODES.find((mode) => mode.mode === magneticConfig.mode)?.icon}{" "}
								{isDisabled ? "disabled" : (magneticConfig.mode ?? "disabled")}
							</span>
							/&gt;
						</>
					)}

					{uiState.enabledFeatures.length > 1 && (
						<span className="text-foreground/30">+</span>
					)}

					{uiState.enabledFeatures.includes("luminance") && (
						<>
							&lt;Luminance
							<span
								className={`${
									uiState.luminanceEnabled
										? "bg-luminance-mode-enabled/10 border-luminance-mode-enabled/70 text-luminance-mode-enabled"
										: "bg-luminance-mode-disabled/10 border-luminance-mode-disabled/70 text-luminance-mode-disabled"
								}
							flex border items-center gap-2 px-1.5 py-1 pr-2 uppercase font-sans rounded-full text-xs w-fit`}
							>
								<span
									className={`${uiState.luminanceEnabled ? "bg-luminance-mode-enabled" : "bg-luminance-mode-disabled"} size-2 rounded-full`}
								></span>
								{uiState.luminanceEnabled ? "enabled" : "disabled"}
							</span>{" "}
							/&gt;
						</>
					)}
				</h1>

				<p className="text-sm mt-1 text-foreground/50">
					UI mouse interaction component for React.
					<br />
					<small>Move your cursor over or near the elements</small>
				</p>
			</header>

			<RadiusOverlay
				radius={magneticConfig.radius ?? 150}
				show={uiState.showRadius && isMagneticActive}
			/>

			<div className="flex flex-wrap items-center justify-center gap-20 grow">
				<Luminance {...luminanceProps}>
					<Magnetic {...magneticProps}>
						<Button />
					</Magnetic>
				</Luminance>

				<Luminance {...luminanceProps}>
					<Magnetic {...magneticProps}>
						<Card />
					</Magnetic>
				</Luminance>
			</div>

			<footer>
				<a
					target="_blank"
					rel="noopener"
					href="https://github.com/diesys/magnetic-ui-react-component"
					className="text-xs text-foreground/20 hover:text-foreground/80 transition-colors"
				>
					★ GitHub
				</a>
			</footer>
		</>
	);

	return (
		<div className="min-h-screen max-h-screen bg-background text-foreground flex flex-col">
			<div className="flex flex-1 overflow-hidden relative">
				<main>{children}</main>
				<Sidebar {...sidebarProps} />
			</div>
		</div>
	);
}

export function Demo() {
	return (
		<AppProvider>
			<DemoContent />
		</AppProvider>
	);
}
