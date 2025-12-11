import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/homepage/navbar";
import { CartProvider } from "@/context/CartContext";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cleardrip - Smart Water Management",
  description: "Your trusted partner for smart water health monitoring and RO services.",
  icons: {
    icon: "/cleardrip-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5a4" />
      </head>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* <Header /> */}
          <CartProvider >
            <Navbar />
            <Toaster />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
