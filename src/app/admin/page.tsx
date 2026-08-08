import type { Metadata } from "next";
import { AdminPortal } from "@/components/admin/AdminPortal";

export const metadata: Metadata = {
  title: "Administrator Sign In — Math Stars",
  description: "Secure administrator access for the Math Stars Learning Observatory.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPortal />;
}
