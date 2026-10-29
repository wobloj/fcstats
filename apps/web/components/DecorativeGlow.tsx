export default function DecorativeGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-1/2 z-0 h-[60vw] w-[75vw] -translate-x-1/2 -translate-y-8/12 rounded-full blur-3xl"
      style={{
        background:
          "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 24%, transparent) 24%, var(--secondary) 70%)",
      }}
    />
  )
}
