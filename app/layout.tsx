import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://mss-feedback.vercel.app"),
  title: {
    default: "Loud and sound — Louder together",
    template: "%s — Loud and sound",
  },
  description:
    "The campus complaint wall. Post anonymously, upvote what matters, and make your college listen.",
  openGraph: {
    title: "Loud and sound — Louder together",
    description:
      "The campus complaint wall. Post anonymously, upvote what matters, and make your college listen.",
    type: "website",
    siteName: "Loud and sound",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Loud and sound — Louder together",
    description:
      "The campus complaint wall. Post anonymously, upvote what matters, and make your college listen.",
    images: ["/opengraph-image"],
  },
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}