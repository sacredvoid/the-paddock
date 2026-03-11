import type { Metadata } from "next";
import { inter, titillium, jetbrainsMono } from "@/lib/fonts";
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
      className={`${inter.variable} ${titillium.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
