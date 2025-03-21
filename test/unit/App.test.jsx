/**
 * Unit tests for App component.
*/
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import App from "../../src/App";

vi.mock("../components/Header", () => ({
  default: () => <nav><a href="/files">Files</a></nav>
}));

describe("App component", () => {
  it("renders without crashing", () => {
    render(<App Router={MemoryRouter} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});