import { render, screen } from "@testing-library/react";
import { Rating } from "@/components/ui/Rating";

describe("Rating", () => {
  it("exposes the rating value in an accessible label", () => {
    render(<Rating value={4.5} count={128} />);
    expect(screen.getByRole("img", { name: "Rated 4.5 out of 5" })).toBeInTheDocument();
  });

  it("displays the review count", () => {
    render(<Rating value={3} count={2048} />);
    expect(screen.getByText("(2,048)")).toBeInTheDocument();
  });

  it("omits the count text when none is provided", () => {
    render(<Rating value={5} />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });
});
