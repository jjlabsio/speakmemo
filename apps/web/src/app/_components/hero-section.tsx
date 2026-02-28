import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export function HeroSection() {
  return (
    <section
      aria-label="서비스 소개"
      className="relative overflow-hidden pt-24"
    >
      {/* Subtle indigo + amber gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 80% 10%, rgba(245,158,11,0.08), transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-16 text-center md:pb-32 md:pt-20">
        {/* Pill badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          말하면, 정리된다.
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          그냥 말하세요.
          <br />
          <span className="text-primary">semo</span>가 알아서 정리해 드릴게요.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
          녹음 버튼 하나로 아이디어, 회의, 메모를 구조화된 노트로.
          <br />
          AI가 요약, 핵심 포인트, 할 일 목록을 자동으로 정리해 드려요.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/app">
            <Button
              className="rounded-full px-8 py-6 text-base font-semibold"
              size="lg"
            >
              지금 말해보세요
            </Button>
          </Link>
        </div>

        {/* App mockup placeholder */}
        <div className="mx-auto mt-20 max-w-2xl">
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-background shadow-[0_32px_64px_rgba(99,102,241,0.08),0_10px_12px_-6px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
              <div className="size-3 rounded-full bg-neutral-300" />
              <div className="size-3 rounded-full bg-neutral-300" />
              <div className="size-3 rounded-full bg-neutral-300" />
              <div className="ml-4 h-5 w-48 rounded-md bg-muted" />
            </div>
            <div className="flex flex-col items-center justify-center gap-4 bg-muted/10 px-8 py-20">
              {/* Simulated recording UI */}
              <div className="flex size-16 items-center justify-center rounded-full bg-primary shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="size-8"
                  aria-hidden="true"
                >
                  <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                  <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                녹음 버튼을 누르고 말하면 semo가 정리해 드려요
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
