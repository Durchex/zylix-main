import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Add to cart</Button>);
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });

  it("fires onClick when clicked", () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Buy now</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Buy now" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and shows a busy state while loading", () => {
    render(<Button isLoading>Submitting</Button>);
    const button = screen.getByRole("button", { name: "Submitting" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("does not fire onClick when disabled", () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Unavailable
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Unavailable" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
