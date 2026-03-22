import { MagneticProps } from "../lib/Magnetic";
import { LuminanceProps } from "../lib/Luminance";
import { LUMINANCE_DEFAULTS as LUM_CONFIG } from "./luminanceConfig";

export type { LuminanceProps };

export const LUMINANCE_DEFAULTS = LUM_CONFIG;

export const MAGNETIC_DEFAULTS: MagneticProps = {
  radius: 150,
  falloff: "inverse",
  mode: "attract",
  disabled: false,
  translate: true,
  moveIntensity: 40,
  rotate: true,
  rotateIntensity: 15,
  skew: false,
  skewIntensity: 10,
  stretch: false,
  stretchIntensity: 0.3,
  scale: false,
  scaleIntensity: 0.2,
  tilt: true,
  tiltIntensity: 15,
  perspective: 800,
  opacity: false,
  opacityIntensity: 0.4,
  spring: true,
  springStiffness: 0.15,
  springDamping: 0.25,
  children: null,
};
