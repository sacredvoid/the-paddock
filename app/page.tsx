export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero section with carbon fiber texture */}
      <section className="carbon-fiber relative flex flex-col items-center justify-center gap-8 px-6 py-24">
        <h1 className="text-center text-5xl font-black tracking-tight text-text-primary md:text-7xl"
            style={{ fontFamily: "var(--font-titillium)" }}>
          THE <span className="text-f1-red">PADDOCK</span>
        </h1>
        <p className="max-w-lg text-center text-lg text-text-secondary">
          Everything about Formula 1. Drivers, circuits, race analysis,
          historical records, and interactive visualizations.
        </p>
        <div className="h-1 w-24 rounded bg-f1-red" />
      </section>

      {/* Design system preview */}
      <section className="dot-grid px-6 py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Color palette */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-text-primary"
                style={{ fontFamily: "var(--font-titillium)" }}>
              Color Palette
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg bg-f1-red" />
                <span className="text-xs text-text-secondary">F1 Red</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg bg-accent" />
                <span className="text-xs text-text-secondary">Accent</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg bg-surface" />
                <span className="text-xs text-text-secondary">Surface</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg bg-surface-elevated" />
                <span className="text-xs text-text-secondary">Elevated</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-lg border border-border-subtle bg-background" />
                <span className="text-xs text-text-secondary">Background</span>
              </div>
            </div>
          </div>

          {/* Stats preview with monospace numbers */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-text-primary"
                style={{ fontFamily: "var(--font-titillium)" }}>
              Stats Display
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Championships", value: "7" },
                { label: "Race Wins", value: "103" },
                { label: "Pole Positions", value: "104" },
                { label: "Fastest Laps", value: "77" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border-subtle bg-surface-elevated p-4"
                >
                  <div className="stats-number text-3xl font-bold text-f1-red">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-text-secondary">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team colors preview */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-text-primary"
                style={{ fontFamily: "var(--font-titillium)" }}>
              Team Colors
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Red Bull", color: "#3671C6" },
                { name: "Mercedes", color: "#27F4D2" },
                { name: "Ferrari", color: "#E8002D" },
                { name: "McLaren", color: "#FF8000" },
                { name: "Aston Martin", color: "#229971" },
                { name: "Alpine", color: "#FF87BC" },
                { name: "Williams", color: "#64C4FF" },
                { name: "RB", color: "#6692FF" },
                { name: "Kick Sauber", color: "#52E252" },
                { name: "Haas", color: "#B6BABD" },
              ].map((team) => (
                <div
                  key={team.name}
                  className="flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="text-sm text-text-primary">{team.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
