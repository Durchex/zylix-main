import { redirect } from "next/navigation";

// /support/contact is kept as a redirect to /contact for old links/bookmarks
// — the page itself now lives at /contact to match the site's sitemap.
export default function ContactRedirectPage() {
  redirect("/contact");
}
