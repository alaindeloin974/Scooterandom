import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScootGen — Find your next combo",
  description: "Generate scooter freestyle combos, take on challenges and level up."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
