import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fredoka";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AccessGate } from "@/components/AccessGate";
import { cookies } from "next/headers";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { activeSessionFromValue } from "@/lib/session-access";
import { MotionPreferences } from "@/components/MotionPreferences";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://math-stars-production.up.railway.app",
  ),
  applicationName: "Math Stars",
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
    icon: [
      {
        url: "/brand/math-stars-favicon-64.png",
        type: "image/png",
        sizes: "64x64",
      },
      {
        url: "/brand/math-stars-icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/brand/math-stars-apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Math Stars",
    title: "Math Stars — Math Learning for Kids",
    description:
      "Free math adventures for children from preschool through 4th grade, with practice, rewards, and parent progress tracking.",
    images: [
      {
        url: "/brand/math-stars-meta.png",
        width: 1200,
        height: 630,
        alt: "Math Stars, small steps and bright futures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Math Stars — Math Learning for Kids",
    description:
      "Free math adventures for children from preschool through 4th grade.",
    images: ["/brand/math-stars-meta.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Math Stars",
  },
};

export const viewport: Viewport = {
  themeColor: "#2e6b4f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(SESSION_COOKIE)?.value;
  const signedSession = readSessionValue(sessionValue);
  const authenticated = !!(await activeSessionFromValue(sessionValue));
  const staleSession = !!signedSession && !authenticated;
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <MotionPreferences>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-black">Skip to main content</a>
          <AccessGate authenticated={authenticated} staleSession={staleSession}>{children}</AccessGate>
          <Toaster />
          <ServiceWorkerRegister authenticated={authenticated} />
        </MotionPreferences>
      </body>
    </html>
  );
}
