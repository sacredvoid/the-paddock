import type { Metadata } from "next";
import { inter, jetbrainsMono } from "@/lib/fonts";
import { CommandPalette } from "@/components/search/command-palette";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Paddock - F1 Encyclopedia",
  description: "Everything about Formula 1. Drivers, circuits, race analysis, historical records, and interactive visualizations.",
  openGraph: {
    title: "The Paddock - F1 Encyclopedia",
    description: "Everything about Formula 1.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
