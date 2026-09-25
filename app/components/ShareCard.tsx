<div
  className="relative aspect-square rounded-[40px] overflow-hidden border backdrop-blur-xl"                </div>
              </div>{isMinting ? (
  <Loader2 className="w-6 h-6 animate-spin" />
) : mintFailed ? (
  <AlertCircle className="w-6 h-6 text-red-500" />
) : (
  <Sparkles className="w-6 h-6" />
)}<h3
  className="text-7xl font-black mb-1 tracking-tight leading-none"
  style={{
    color:
      mode === "dark"
        ? "rgba(255,255,255,0.9)"
        : "rgba(0,0,0,0.8)",
  }}
>
  SHARE
</h3>

<h3
  className="text-8xl font-black mb-6 tracking-tight leading-none"
  style={{
    background:
      mode === "dark"
        ? `linear-gradient(to right, #ffffff, var(--color-theme-primary))`
        : `linear-gradient(to right, #1a1a1a, var(--color-theme-primary))`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  YOUR WRAP
</h3>