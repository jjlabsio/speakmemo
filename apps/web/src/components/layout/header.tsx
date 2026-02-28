import Link from "next/link";
import { Button } from "@repo/ui/components/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full px-6 pt-4">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full border border-border/50 bg-background/80 px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-primary"
        >
          semo
        </Link>

        <Link href="/app">
          <Button className="rounded-full px-5" size="sm">
            무료로 시작하기
          </Button>
        </Link>
      </div>
    </header>
  );
}
