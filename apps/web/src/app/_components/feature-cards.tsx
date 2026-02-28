import { IconMicrophone, IconSparkles, IconNotes } from "@tabler/icons-react";

const FEATURES = [
  {
    icon: IconMicrophone,
    title: "버튼 하나로 녹음",
    description:
      "말하기만 하면 됩니다. 복잡한 설정 없이 녹음 버튼 하나로 메모를 시작하세요.",
  },
  {
    icon: IconSparkles,
    title: "AI가 알아서 정리",
    description:
      "요약, 핵심 포인트, 할 일 목록까지 자동으로 만들어 드려요. 직접 정리할 필요 없어요.",
  },
  {
    icon: IconNotes,
    title: "언제든 꺼내보는 노트",
    description: "깔끔하게 정리된 내 생각들, 필요할 때 바로 꺼내 볼 수 있어요.",
  },
] as const;

export function FeatureCards() {
  return (
    <section id="features" className="bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            semo가 하는 일
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            복잡한 건 semo에게 맡기세요.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <Icon size={22} className="text-primary" />
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
