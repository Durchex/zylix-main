import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog } from "@/components/ui/Dialog";

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} onClose={jest.fn()} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and children when open", () => {
    render(
      <Dialog open onClose={jest.fn()} title="Confirm delete">
        <p>Are you sure?</p>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm delete")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    // Dialog renders via a portal into document.body, so query there rather
    // than the RTL container (which only holds the render root).
    const backdrop = document.body.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the Escape key is pressed", () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for keys other than Escape", () => {
    const onClose = jest.fn();
    render(
      <Dialog open onClose={onClose} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on close", () => {
    const { unmount } = render(
      <Dialog open onClose={jest.fn()} title="Confirm">
        <p>Body</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
