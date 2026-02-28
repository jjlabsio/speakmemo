import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "../hero-section";

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

describe("HeroSection", () => {
  it("renders the main headline with '그냥 말하세요'", () => {
    render(<HeroSection />);
    expect(screen.getByText(/그냥 말하세요/)).toBeInTheDocument();
  });

  it("renders the secondary headline with 'semo가 알아서 정리해 드릴게요'", () => {
    render(<HeroSection />);
    // The text may be split across child elements within the h1
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/semo가 알아서 정리해 드릴게요/);
  });

  it("renders the sub-description mentioning 녹음 버튼", () => {
    render(<HeroSection />);
    // Use getAllByText since 녹음 버튼 may appear in multiple places
    const elements = screen.getAllByText(/녹음 버튼/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders CTA button '지금 말해보세요'", () => {
    render(<HeroSection />);
    expect(screen.getByText("지금 말해보세요")).toBeInTheDocument();
  });

  it("CTA button links to /app", () => {
    render(<HeroSection />);
    const ctaLink = screen.getByRole("link", { name: "지금 말해보세요" });
    expect(ctaLink).toHaveAttribute("href", "/app");
  });

  it("renders the hero as a section element", () => {
    const { container } = render(<HeroSection />);
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
  });

  it("headline is rendered as h1", () => {
    render(<HeroSection />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
  });

  it("does not contain 'Acme' text", () => {
    render(<HeroSection />);
    expect(screen.queryByText(/acme/i)).not.toBeInTheDocument();
  });
});
