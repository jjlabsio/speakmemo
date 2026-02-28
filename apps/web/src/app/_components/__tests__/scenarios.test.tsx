import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Scenarios } from "../scenarios";

describe("Scenarios", () => {
  it("renders a section element", () => {
    const { container } = render(<Scenarios />);
    expect(container.querySelector("section")).not.toBeNull();
  });

  it("renders scenario 1: '출퇴근길 아이디어'", () => {
    render(<Scenarios />);
    expect(screen.getByText(/출퇴근길 아이디어/)).toBeInTheDocument();
  });

  it("renders scenario 1 description about 지하철", () => {
    render(<Scenarios />);
    expect(screen.getByText(/지하철/)).toBeInTheDocument();
  });

  it("renders scenario 2: '회의 끝난 직후'", () => {
    render(<Scenarios />);
    expect(screen.getByText(/회의 끝난 직후/)).toBeInTheDocument();
  });

  it("renders scenario 2 description about 회의록", () => {
    render(<Scenarios />);
    expect(screen.getByText(/회의록/)).toBeInTheDocument();
  });

  it("renders scenario 3: '자기 전 메모'", () => {
    render(<Scenarios />);
    expect(screen.getByText(/자기 전 메모/)).toBeInTheDocument();
  });

  it("renders scenario 3 description about 내일 할 일", () => {
    render(<Scenarios />);
    expect(screen.getByText(/내일 할 일/)).toBeInTheDocument();
  });

  it("renders a section heading", () => {
    render(<Scenarios />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(0);
  });
});
