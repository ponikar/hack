import type { Metadata } from "next";
import { Schibsted_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Schibsted_Grotesk({
  variable: "--font-sans-face",
  subsets: ["latin"],
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Buyer Watchdog",
  description:
    "Enter a store URL. Watchdog replays the shopping journeys ChatGPT, Perplexity, Grok, Google and Amazon agents attempt, shows the step where each one dies, and lists the fixes.",
  openGraph: {
    title: "AI Buyer Watchdog",
    description: "See where AI buyers give up on your store. Nothing is bought.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">{children}</body>
    </html>
  );
}
