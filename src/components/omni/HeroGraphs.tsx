export function HeroGraphs() {
  const bars = Array.from({ length: 18 }, (_, i) => 20 + ((i * 37) % 50) + i * 2);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hg-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="var(--navy-foreground)" strokeOpacity="0.08" />
          </pattern>
          <linearGradient id="hg-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1200" height="700" fill="url(#hg-grid)" />
        <g>
          {bars.map((h, i) => (
            <rect key={i} className="hg-bar" x={40 + i * 64} width="34" y={700 - h * 5} height={h * 5}
              fill="var(--primary)" fillOpacity="0.18" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </g>
        <path className="hg-area" d="M0 620 C150 600 220 560 340 540 S560 470 680 430 S900 300 1020 240 S1150 150 1200 120 L1200 700 L0 700Z" fill="url(#hg-fill)" />
        <path className="hg-line" d="M0 620 C150 600 220 560 340 540 S560 470 680 430 S900 300 1020 240 S1150 150 1200 120" fill="none" stroke="var(--primary)" strokeWidth="4" />
        <path className="hg-line hg-line2" d="M0 660 C200 650 300 620 420 600 S640 560 760 520 S980 440 1200 360" fill="none" stroke="var(--navy-foreground)" strokeOpacity="0.5" strokeWidth="2" />
      </svg>
    </div>
  );
}
