import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { MagneticModeType } from "../../../lib/Magnetic";

type Feature = "magnetic" | "luminance";
export interface UIState {
	showRadius: boolean;
	magneticEnabled: boolean;
	magneticMode: MagneticModeType | undefined;
	luminanceEnabled: boolean;
	enabledFeatures: Feature[];
}

export interface UIContextValue {
	uiState: UIState;
	setShowRadius: Dispatch<SetStateAction<boolean>>;
	toggleShowRadius: () => void;
	setMagneticEnabled: Dispatch<SetStateAction<boolean>>;
	toggleMagneticEnabled: () => void;
	setLuminanceEnabled: Dispatch<SetStateAction<boolean>>;
	toggleLuminanceEnabled: () => void;
	setMagneticMode: Dispatch<SetStateAction<MagneticModeType | undefined>>;
}

export const initialUIState: UIState = {
	showRadius: false,
	magneticEnabled: true,
	magneticMode: "attract",
	luminanceEnabled: false,
	// TODO: re-enable luminance when it will pass alpha development
	enabledFeatures: ["magnetic"],
};

export const UIContext = createContext<UIContextValue | null>(null);

interface AppProviderProps {
	children: ReactNode;
	initialState?: Partial<UIState>;
}

export function AppProvider({ children, initialState }: AppProviderProps) {
	const [showRadius, setShowRadius] = useState(
		initialState?.showRadius ?? initialUIState.showRadius,
	);
	const [magneticEnabled, setMagneticEnabled] = useState(
		initialState?.magneticEnabled ?? initialUIState.magneticEnabled,
	);
	const [luminanceEnabled, setLuminanceEnabled] = useState(
		initialState?.luminanceEnabled ?? initialUIState.luminanceEnabled,
	);
	const [magneticMode, setMagneticMode] = useState(
		initialState?.magneticMode ?? initialUIState.magneticMode,
	);
	const [enabledFeatures] = useState(
		initialState?.enabledFeatures ?? initialUIState.enabledFeatures,
	);

	const toggleShowRadius = useCallback(() => {
		setShowRadius((prev) => !prev);
	}, []);

	const toggleMagneticEnabled = useCallback(() => {
		setMagneticEnabled((prev) => !prev);
	}, []);

	const toggleLuminanceEnabled = useCallback(() => {
		setLuminanceEnabled((prev) => !prev);
	}, []);

	const value = useMemo(
		(): UIContextValue => ({
			uiState: {
				showRadius,
				magneticEnabled,
				luminanceEnabled,
				magneticMode,
				enabledFeatures,
			},
			setShowRadius,
			toggleShowRadius,
			setMagneticEnabled,
			setMagneticMode,
			toggleMagneticEnabled,
			setLuminanceEnabled,
			toggleLuminanceEnabled,
		}),
		[
			showRadius,
			magneticEnabled,
			magneticMode,
			luminanceEnabled,
			toggleShowRadius,
			toggleMagneticEnabled,
			toggleLuminanceEnabled,
			enabledFeatures,
		],
	);

	return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
	const context = useContext(UIContext);
	if (!context) {
		throw new Error("useUI must be used within an AppProvider");
	}
	return context;
}
