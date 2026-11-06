import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Total Squad Invoice",
  description: "Customers, quotations and invoices for Total Squad.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
