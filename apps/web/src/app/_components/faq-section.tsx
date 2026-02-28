const FAQ_ITEMS = [
  {
    question: "얼마인가요?",
    answer:
      "지금은 무료로 사용하실 수 있어요. 이후 Pro 플랜이 생길 예정이에요.",
  },
  {
    question: "한국어만 되나요?",
    answer:
      "지금은 한국어에 최적화되어 있어요. 영어도 어느 정도 되지만, 한국어가 훨씬 잘 돼요.",
  },
  {
    question: "녹음은 얼마나 길게 할 수 있나요?",
    answer: "한 번에 최대 5분까지 녹음할 수 있어요.",
  },
  {
    question: "내 목소리 데이터는 안전한가요?",
    answer:
      "녹음 파일은 처리 후 안전하게 저장되며, 다른 용도로 사용되지 않아요.",
  },
  {
    question: "앱을 설치해야 하나요?",
    answer:
      "아니요! 브라우저에서 바로 사용할 수 있어요. 홈 화면에 추가하면 앱처럼 쓸 수 있어요.",
  },
] as const;

export function FaqSection() {
  return (
    <section aria-label="자주 묻는 질문" className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            자주 묻는 질문
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            궁금한 점이 있으신가요?
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <details
              key={question}
              className="group rounded-xl border border-border/50 bg-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="border-t border-border/40 px-6 py-4 text-sm leading-relaxed text-muted-foreground">
                {answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
