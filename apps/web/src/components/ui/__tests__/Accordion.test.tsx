import { render, screen, fireEvent } from "@testing-library/react";
import { Accordion } from "@/components/ui/Accordion";

const ITEMS = [
  { question: "What is ZYLIX?", answer: "An e-commerce platform." },
  { question: "How do I return an item?", answer: "Start a return from your orders page." },
  { question: "Do you ship nationwide?", answer: "Yes, across Nigeria." },
];

describe("Accordion", () => {
  it("opens the first item by default", () => {
    render(<Accordion items={ITEMS} />);
    expect(screen.getByText(ITEMS[0]!.answer)).toBeInTheDocument();
    expect(screen.queryByText(ITEMS[1]!.answer)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: ITEMS[0]!.question })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("opens a different item when its question is clicked, closing the previous one", () => {
    render(<Accordion items={ITEMS} />);
    fireEvent.click(screen.getByRole("button", { name: ITEMS[1]!.question }));

    expect(screen.getByText(ITEMS[1]!.answer)).toBeInTheDocument();
    expect(screen.queryByText(ITEMS[0]!.answer)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: ITEMS[0]!.question })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("closes the open item when its question is clicked again", () => {
    render(<Accordion items={ITEMS} />);
    fireEvent.click(screen.getByRole("button", { name: ITEMS[0]!.question }));

    expect(screen.queryByText(ITEMS[0]!.answer)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: ITEMS[0]!.question })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("only ever shows one panel open at a time", () => {
    render(<Accordion items={ITEMS} />);
    fireEvent.click(screen.getByRole("button", { name: ITEMS[2]!.question }));
    fireEvent.click(screen.getByRole("button", { name: ITEMS[1]!.question }));

    expect(screen.queryByText(ITEMS[2]!.answer)).not.toBeInTheDocument();
    expect(screen.getByText(ITEMS[1]!.answer)).toBeInTheDocument();
  });
});
