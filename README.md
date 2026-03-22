# Magnetic UI React Component

Physics-inspired mouse interaction component for React

## Running the code

Run `bun install` to install the dependencies.

Run `bun run dev` to start the development server.

Run `bun run build` to build the production bundle.

```tsx
<Magnetic
  radius={171}
  falloff="quadratic"
  mode="attract"
  translate={true}
  moveIntensity={40}
  rotate={true}
  rotateIntensity={2}
  skew={true}
  skewIntensity={3.5}
  stretch={true}
  stretchIntensity={0.19}
  scale={false}
  scaleIntensity={0.2}
  tilt={true}
  tiltIntensity={19.5}
  perspective={680}
  opacity={false}
  opacityIntensity={0.4}
  spring={true}
  springStiffness={0.15}
  springDamping={0.25}
>
  {children}
</Magnetic>
```
