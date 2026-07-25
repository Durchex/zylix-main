import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zylix — Technology Made Simple.",
    template: "%s | Zylix",
  },
  description:
    "Zylix is a premium electronics marketplace for smartphones, laptops, gaming, wearables, and home appliances. Powered by Durchex D.A.M Company LTD.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <ThemeProvider>
          <SessionProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
