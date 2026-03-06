import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Velocity - Asteroid Simulator",
  description: "Predict and simulate asteroid impacts using real-time NASA NeoWS data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white antialiased overflow-hidden`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
