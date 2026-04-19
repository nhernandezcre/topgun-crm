import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "700", "900"],
  style: ["normal", "italic"]
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shouldibuy.this";
const DESCRIPTION =
  "Before you tap buy, tap this. Point your phone at anything. We tell you if it's worth it, if you're getting ripped off, and what to buy instead. Takes 8 seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Should I Buy This?",
    template: "%s · Should I Buy This?"
  },
  description: DESCRIPTION,
  applicationName: "Should I Buy This?",
  appleWebApp: {
    capable: true,
    title: "Should I Buy",
    statusBarStyle: "black-translucent"
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-touch-icon.svg"
  },
  openGraph: {
    title: "Should I Buy This?",
    description: DESCRIPTION,
    type: "website",
    images: ["/og-home.svg"]
  },
  twitter: { card: "summary_large_image", title: "Should I Buy This?", description: DESCRIPTION }
};

export const viewport: Viewport = {
  themeColor: "#07080A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable} dark`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="font-sans antialiased grain">
        {children}
        {/* register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
