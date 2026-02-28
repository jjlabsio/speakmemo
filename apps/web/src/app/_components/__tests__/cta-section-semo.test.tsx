import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SemoCtaSection } from "../semo-cta-section";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@repo/ui/components/button", () => ({
  Button: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button className={className} {...props}>
      {children}
    </button>
  ),
}));

describe("SemoCtaSection", () => {
  it("renders a section element", () => {
    const { container } = render(<SemoCtaSection />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("renders the CTA heading '지금 바로 시작하세요'", () => {
    render(<SemoCtaSection />);
    expect(screen.getByText(/지금 바로 시작하세요/)).toBeInTheDocument();
  });

  it("renders the CTA description about 타이핑", () => {
    render(<SemoCtaSection />);
    expect(screen.getByText(/타이핑/)).toBeInTheDocument();
  });

  it("renders CTA button '무료로 시작하기'", () => {
    render(<SemoCtaSection />);
    expect(screen.getByText("무료로 시작하기")).toBeInTheDocument();
  });

  it("CTA button links to /app", () => {
    render(<SemoCtaSection />);
    const ctaLink = screen.getByRole("link", { name: "무료로 시작하기" });
    expect(ctaLink).toHaveAttribute("href", "/app");
  });

  it("does not contain 'Acme'", () => {
    render(<SemoCtaSection />);
    expect(screen.queryByText(/acme/i)).not.toBeInTheDocument();
  });
});
