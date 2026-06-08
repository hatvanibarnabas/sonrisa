import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sonrisa Alerts",
  description: "World event alerts — news, markets, disasters",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
