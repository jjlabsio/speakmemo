import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../header";

// Mock next/link
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

// Mock @repo/ui Button
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

describe("Header", () => {
  it("renders the semo logo", () => {
    render(<Header />);
    const logo = screen.getByText("semo");
    expect(logo).toBeInTheDocument();
  });

  it("does NOT render 'Acme' text", () => {
    render(<Header />);
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    expect(screen.queryByText(/acme/i)).not.toBeInTheDocument();
  });

  it("logo links to home page", () => {
    render(<Header />);
    const logoLink = screen.getByText("semo").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders CTA button '무료로 시작하기'", () => {
    render(<Header />);
    const cta = screen.getByRole("button", { name: "무료로 시작하기" });
    expect(cta).toBeInTheDocument();
  });

  it("CTA button links to /app", () => {
    render(<Header />);
    // The CTA should be wrapped in or render as a link to /app
    const ctaLink = screen.getByRole("link", { name: "무료로 시작하기" });
    expect(ctaLink).toHaveAttribute("href", "/app");
  });

  it("renders header as a landmark element", () => {
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });

  it("has correct semantic HTML structure", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).not.toBeNull();
  });
});
