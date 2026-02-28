import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export function SemoCtaSection() {
  return (
    <section aria-label="시작하기" className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          지금 바로 시작하세요
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          타이핑은 그만. 말하면 semo가 정리해 드려요.
        </p>
        <div className="mt-10">
          <Link href="/app">
            <Button
              className="rounded-full px-10 py-6 text-base font-semibold"
              size="lg"
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
