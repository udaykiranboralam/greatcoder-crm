import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://thegreatcoder.com"),
  title: {
    default: "GreatCoder Trainings | AI Admissions & Career Counseling",
    template: "%s | GreatCoder Trainings",
  },
  description:
    "Launch your IT career with GreatCoder Trainings in Madhapur, Hyderabad. Practical DevOps, Cyber Security, Ethical Hacking, Python & Java Full Stack, Data Science and Cloud Computing courses with expert mentorship and placement assistance.",
  keywords: [
    "IT training Madhapur",
    "DevOps course Hyderabad",
    "Cyber Security training Hyderabad",
    "Python Full Stack course",
    "Java Full Stack course",
    "Data Science course Hyderabad",
    "career counseling Hyderabad",
    "GreatCoder",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        <Toaster />
      </body>
    </html>
  );
}