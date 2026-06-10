import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agentic Arc — Proposals",
  description: "Secure proposal review and signing for Agentic Arc clients.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body bg-white text-charcoal antialiased">
        <header className="bg-navy">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center gap-3">
            {/* Logo added in Phase 5 — public/brand/logo.svg */}
            <span className="font-display text-xl text-white tracking-wide">
              Agentic Arc
            </span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
