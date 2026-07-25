import { sanitizeRichText } from "@/utils/sanitizeHtml";

describe("sanitizeRichText", () => {
  it("strips <script> tags", () => {
    const result = sanitizeRichText('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips inline event handler attributes", () => {
    const result = sanitizeRichText('<img src="x.jpg" onerror="alert(1)">');
    expect(result).not.toContain("onerror");
  });

  it("strips javascript: URLs", () => {
    const result = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("preserves allowed formatting tags", () => {
    const result = sanitizeRichText("<h2>Title</h2><p>Body <strong>bold</strong> text</p>");
    expect(result).toContain("<h2>Title</h2>");
    expect(result).toContain("<strong>bold</strong>");
  });
});
