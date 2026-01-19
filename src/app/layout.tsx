import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Primary UI Font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Monospace font for data/numbers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Smart Trader Cockpit",
  description: "AI-Powered Technical Analysis & Decision Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-blue-500/30`}>
        {children}
      </body>
    </html>
  );
}
