import type { Metadata, Viewport } from "next";
import { Anton, Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Anton for the masthead: a single heavy condensed cut, which is exactly the
// voice of the printed reference. Inter carries everything else.
const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// The collage references set their small copy in a monospace, tracked out and
// justified. It carries the About page's spec blocks and body column.
const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nesh — Director, Photographer, Videographer",
  description:
    "Amsterdam-based director, photographer and videographer. Selected directing, photography, videography and production work.",
  openGraph: {
    title: "Nesh — Director, Photographer, Videographer",
    description:
      "Selected film and photography: music video, commercial, documentary, fashion and aerial work.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0708",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
