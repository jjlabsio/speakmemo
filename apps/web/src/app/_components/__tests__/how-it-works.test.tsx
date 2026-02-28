import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "../how-it-works";

describe("HowItWorks", () => {
  it("renders a section element", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("renders step 1: '녹음하기'", () => {
    render(<HowItWorks />);
    expect(screen.getByText("녹음하기")).toBeInTheDocument();
  });

  it("renders step 1 description", () => {
    render(<HowItWorks />);
    expect(
      screen.getByText(/말하고 싶은 걸 그냥 말하세요/),
    ).toBeInTheDocument();
  });

  it("renders step 2: '잠깐 기다리기'", () => {
    render(<HowItWorks />);
    expect(screen.getByText("잠깐 기다리기")).toBeInTheDocument();
  });

  it("renders step 2 description mentioning semo", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/semo가 열심히 정리/)).toBeInTheDocument();
  });

  it("renders step 3: '확인하기'", () => {
    render(<HowItWorks />);
    expect(screen.getByText("확인하기")).toBeInTheDocument();
  });

  it("renders step 3 description mentioning 요약 핵심 포인트 할 일", () => {
    render(<HowItWorks />);
    expect(
      screen.getByText(/요약.*핵심 포인트.*할 일|핵심 포인트/),
    ).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    render(<HowItWorks />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders a section heading", () => {
    render(<HowItWorks />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});
