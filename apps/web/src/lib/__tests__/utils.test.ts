import { cn, formatPrice } from "@/lib/utils";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind utility classes to the last one (tailwind-merge behavior)", () => {
    // Without merge logic this would naively be "px-2 px-4"; tailwind-merge
    // recognizes both set horizontal padding and keeps only the winner.
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});

describe("formatPrice", () => {
  it("formats a number as NGN currency by default", () => {
    const result = formatPrice(1250000);
    expect(result).toContain("1,250,000");
    expect(result).toMatch(/NGN|₦/);
  });

  it("accepts a numeric string (as prices arrive from the API)", () => {
    expect(formatPrice("1250000")).toBe(formatPrice(1250000));
  });

  it("always shows exactly 2 decimal places", () => {
    expect(formatPrice(100)).toMatch(/\.00/);
  });

  it("supports a different currency code", () => {
    const result = formatPrice(100, "USD");
    expect(result).toMatch(/USD|\$/);
  });
});
