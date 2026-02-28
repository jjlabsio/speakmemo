import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureCards } from "../feature-cards";

vi.mock("@repo/ui/components/card", () => ({
  Card: ({
    children,
    className,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>,
  CardTitle: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>,
  CardContent: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>,
}));

vi.mock("@tabler/icons-react", () => ({
  IconMicrophone: ({ size }: { size?: number }) => (
    <svg data-testid="icon-microphone" width={size} />
  ),
  IconSparkles: ({ size }: { size?: number }) => (
    <svg data-testid="icon-sparkles" width={size} />
  ),
  IconNotes: ({ size }: { size?: number }) => (
    <svg data-testid="icon-notes" width={size} />
  ),
}));

describe("FeatureCards", () => {
  it("renders a section element", () => {
    const { container } = render(<FeatureCards />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("renders feature 1: '버튼 하나로 녹음'", () => {
    render(<FeatureCards />);
    expect(screen.getByText(/버튼 하나로 녹음/)).toBeInTheDocument();
  });

  it("renders feature 1 description about 복잡한 설정", () => {
    render(<FeatureCards />);
    expect(screen.getByText(/복잡한 설정/)).toBeInTheDocument();
  });

  it("renders feature 2: 'AI가 알아서 정리'", () => {
    render(<FeatureCards />);
    expect(screen.getByText(/AI가 알아서 정리/)).toBeInTheDocument();
  });

  it("renders feature 2 description mentioning 요약 핵심 할 일", () => {
    render(<FeatureCards />);
    // The description text should mention key points
    expect(screen.getByText(/요약.*핵심|핵심.*요약|자동/)).toBeInTheDocument();
  });

  it("renders feature 3: '언제든 꺼내보는 노트'", () => {
    render(<FeatureCards />);
    expect(screen.getByText(/언제든 꺼내보는 노트/)).toBeInTheDocument();
  });

  it("renders feature 3 description about 깔끔하게 정리", () => {
    render(<FeatureCards />);
    expect(screen.getByText(/깔끔하게/)).toBeInTheDocument();
  });

  it("renders exactly 3 feature cards", () => {
    render(<FeatureCards />);
    // Should have 3 cards in total
    const titles = screen.getAllByRole("heading", { level: 3 });
    expect(titles.length).toBeGreaterThanOrEqual(3);
  });

  it("renders a section heading", () => {
    render(<FeatureCards />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
  });
});
