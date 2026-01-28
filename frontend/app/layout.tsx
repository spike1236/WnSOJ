import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CsrfInit from "@/components/CsrfInit";

export const metadata: Metadata = {
  title: {
    default: "WnSOJ",
    template: "%s | WnSOJ"
  },
  description: "Programming challenges, problem-solving, and career opportunities."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <div className="min-h-dvh flex flex-col">
          <CsrfInit />
          <SiteHeader />
          <main className="flex-1 pt-16">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
