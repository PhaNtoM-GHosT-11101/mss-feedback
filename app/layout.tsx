import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import CollegeTheme from "@/components/CollegeTheme";

export const metadata: Metadata = {
  title: "Campus Feedback",
  description:
    "Complaints, daily food ratings and praise for your campus mess and hostel life.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem("mss-theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://gmkzcxvgbhhvznbkxlae.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://gmkzcxvgbhhvznbkxlae.supabase.co" />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <CollegeTheme />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}