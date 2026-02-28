const STEPS = [
  {
    number: "1",
    title: "녹음하기",
    description: "말하고 싶은 걸 그냥 말하세요. 3분이면 충분해요.",
  },
  {
    number: "2",
    title: "잠깐 기다리기",
    description: "semo가 열심히 정리하고 있어요. 몇 초면 완료돼요.",
  },
  {
    number: "3",
    title: "확인하기",
    description: "요약, 핵심 포인트, 할 일 목록이 완성됐어요. 바로 확인하세요.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-label="사용 방법" className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            이렇게 간단해요
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            단 3단계. 복잡한 과정 없이.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {STEPS.map(({ number, title, description }) => (
            <div
              key={number}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {number}
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
