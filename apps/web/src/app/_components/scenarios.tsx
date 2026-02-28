const SCENARIOS = [
  {
    emoji: "🚇",
    title: "출퇴근길 아이디어",
    description:
      "지하철에서 떠오른 생각, 그냥 말해두세요. semo가 정리해 드려요.",
  },
  {
    emoji: "💼",
    title: "회의 끝난 직후",
    description: "회의록 대신 30초 말하기. 핵심만 뽑아 드려요.",
  },
  {
    emoji: "🌙",
    title: "자기 전 메모",
    description: "내일 할 일, 누워서 말하면 끝. 타이핑할 필요 없어요.",
  },
] as const;

export function Scenarios() {
  return (
    <section aria-label="활용 시나리오" className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            이런 순간에 쓰세요
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            타이핑이 귀찮은 모든 순간, semo가 함께해요.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {SCENARIOS.map(({ emoji, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {emoji}
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
