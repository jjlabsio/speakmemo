import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../footer";

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

describe("Footer", () => {
  it("renders the semo logo/brand name", () => {
    render(<Footer />);
    const logo = screen.getByText("semo");
    expect(logo).toBeInTheDocument();
  });

  it("does NOT render 'Acme' text anywhere", () => {
    render(<Footer />);
    expect(screen.queryByText(/acme/i)).not.toBeInTheDocument();
  });

  it("renders copyright notice with semo", () => {
    render(<Footer />);
    const copyright = screen.getByText(/2026.*semo/i);
    expect(copyright).toBeInTheDocument();
  });

  it("renders 서비스 소개 link", () => {
    render(<Footer />);
    expect(screen.getByText("서비스 소개")).toBeInTheDocument();
  });

  it("renders 개인정보처리방침 link", () => {
    render(<Footer />);
    expect(screen.getByText("개인정보처리방침")).toBeInTheDocument();
  });

  it("renders 문의하기 link", () => {
    render(<Footer />);
    expect(screen.getByText("문의하기")).toBeInTheDocument();
  });

  it("renders as a footer landmark element", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });

  it("logo links to home page", () => {
    render(<Footer />);
    const logoLink = screen.getByText("semo").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });
});
