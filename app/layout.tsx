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
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
