import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqSection } from "../faq-section";

describe("FaqSection", () => {
  it("renders a section element", () => {
    const { container } = render(<FaqSection />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("renders a section heading for FAQ", () => {
    render(<FaqSection />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it("renders Q1: 얼마인가요 / 무료", () => {
    render(<FaqSection />);
    // The question '얼마인가요?' appears in summary, may appear in answer too
    const elements = screen.getAllByText(/얼마/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders Q2: 한국어", () => {
    render(<FaqSection />);
    // 한국어 can appear in both the question and answer
    const elements = screen.getAllByText(/한국어/);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("renders Q3: 녹음.*얼마나 길게", () => {
    render(<FaqSection />);
    expect(screen.getByText(/녹음.*얼마나|얼마나.*녹음/)).toBeInTheDocument();
  });

  it("renders Q4: 목소리 데이터 / 안전", () => {
    render(<FaqSection />);
    expect(
      screen.getByText(/데이터.*안전|안전.*데이터|목소리/),
    ).toBeInTheDocument();
  });

  it("renders Q5: 앱을 설치", () => {
    render(<FaqSection />);
    expect(screen.getByText(/앱을 설치|설치해야/)).toBeInTheDocument();
  });

  it("renders all 5 FAQ items", () => {
    render(<FaqSection />);
    // Each FAQ item uses a <details> or similar element
    const questions = screen.getAllByRole("group");
    expect(questions.length).toBeGreaterThanOrEqual(5);
  });

  it("FAQ answers are accessible via details/summary", () => {
    const { container } = render(<FaqSection />);
    const detailsElements = container.querySelectorAll("details");
    expect(detailsElements.length).toBeGreaterThanOrEqual(5);
  });

  it("clicking a question reveals the answer", async () => {
    const user = userEvent.setup();
    render(<FaqSection />);
    const summaries = screen.getAllByRole("group");
    // Answer for Q1 should be togglable
    const firstSummary = screen.getByText(/얼마인가요|무료인가요/);
    await user.click(firstSummary);
    expect(screen.getByText(/무료로 사용/)).toBeInTheDocument();
  });
});
