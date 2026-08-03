import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AccessGate } from "@/components/AccessGate";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Math Stars — Math Learning for Kids",
  description:
    "A calm, encouraging math learning adventure for children from preschool through 4th grade, with practice, rewards, and parent progress tracking.",
  keywords: [
    "preschool math",
    "1st grade math",
    "2nd grade math",
    "3rd grade math",
    "4th grade math",
    "multiplication",
    "division",
    "fractions",
    "math for kids",
    "elementary math",
  ],
  authors: [{ name: "Math Stars" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Math Stars",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffaf0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authenticated = verifySessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">Skip to main content</a>
        <AccessGate authenticated={authenticated}>{children}</AccessGate>
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
