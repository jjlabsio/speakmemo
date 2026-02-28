import Link from "next/link";

const FOOTER_LINKS = [
  { label: "서비스 소개", href: "/#features" },
  { label: "개인정보처리방침", href: "/privacy" },
  { label: "문의하기", href: "mailto:hello@speakmemo.app" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-primary"
          >
            semo
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-border/40 pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; 2026 semo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
