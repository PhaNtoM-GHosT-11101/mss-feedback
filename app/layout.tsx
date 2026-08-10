import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSS Feedback — NIT Agartala",
  description:
    "Complaints, daily food ratings and praise for the NIT Agartala Mess & Service Society.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://gmkzcxvgbhhvznbkxlae.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://gmkzcxvgbhhvznbkxlae.supabase.co" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
