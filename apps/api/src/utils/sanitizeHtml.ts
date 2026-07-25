import sanitizeHtml from "sanitize-html";

/**
 * Applied to every rich-text field (blog posts, CMS pages) before it's
 * persisted — the public site renders this HTML unescaped via
 * dangerouslySetInnerHTML, so sanitizing at write time (not read time) is
 * the only point that actually closes the stored-XSS risk.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "p", "a", "ul", "ol", "li", "strong", "em",
      "blockquote", "img", "br", "hr", "code", "pre", "span", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
