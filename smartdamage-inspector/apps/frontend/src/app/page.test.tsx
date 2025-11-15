import { render, screen } from "@testing-library/react";
import HomePage from "./page";

// Mock analyzeDamage so tests don't actually call the backend/API
jest.mock("@/app/lib/api/analyzeDamage", () => ({
  analyzeDamage: jest.fn(),
}));

// Simple mock for framer-motion's motion.button so animations don't break tests
jest.mock("framer-motion", () => ({
  motion: {
    button: ({ whileHover, whileTap, transition, ...rest }: any) => (
      <button {...rest} />
    ),
  },
}));


describe("HomePage", () => {
  test("renders the main heading and description", () => {
    render(<HomePage />);

    // heading
    expect(
      screen.getByRole("heading", { name: /SmartDamage Inspector/i })
    ).toBeInTheDocument();

    // small descriptive text
    expect(
      screen.getByText(/Upload pickup and return photos of a vehicle/i)
    ).toBeInTheDocument();
  });

  test("Analyze Damage button is initially disabled (no files uploaded)", () => {
    render(<HomePage />);

    const analyzeButton = screen.getByRole("button", {
      name: /analyze damage/i,
    });

    expect(analyzeButton).toBeDisabled();
  });

  test("Clear all button is rendered", () => {
    render(<HomePage />);

    const clearButton = screen.getByRole("button", { name: /clear all/i });
    expect(clearButton).toBeInTheDocument();
  });
});
