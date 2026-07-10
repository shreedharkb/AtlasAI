import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AtlasAI — Smart Trip Planner",
  description:
    "Describe your dream trip and let AI craft a personalized day-by-day itinerary. Reorder stops, refine plans, and save your trips.",
  keywords: ["trip planner", "AI", "travel", "itinerary", "vacation planner"],
  openGraph: {
    title: "AtlasAI — Smart Trip Planner",
    description:
      "AI-powered trip planning. Describe your dream trip, get a day-by-day itinerary, and customize it your way.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
