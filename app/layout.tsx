import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Call the Shots Generator — Freestyle Scooter Challenges",
  description: "Generate freestyle scooter combos and challenge your crew in Call the Shots."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
