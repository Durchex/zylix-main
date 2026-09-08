import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ZylixStore — Electronics. Better Living.",
    template: "%s | ZylixStore",
  },
  description:
    "ZylixStore is Nigeria's electronics store for televisions, audio, home and kitchen appliances, air conditioners, and power solutions. Powered by Durchex D.A.M Company LTD.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>
            <CartDrawerProvider>
              <AnnouncementBar />
              <Header />
              <div className="flex-1">{children}</div>
              <Footer />
            </CartDrawerProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
