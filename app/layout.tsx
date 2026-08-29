import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoleProbe",
  description: "Interview the job before it interviews you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-950 antialiased">
        {children}
      </body>
    </html>
  );
}
