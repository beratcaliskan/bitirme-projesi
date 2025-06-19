import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/toast-provider";
import { CartProvider } from "@/components/ui/cart-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "E-Ticaret",
  description: "Modern E-Ticaret Sitesi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="scroll-smooth">
      <body className={inter.className} suppressHydrationWarning>
        <ToastProvider>
          <CartProvider>
            <Header />
            <main className="min-h-screen bg-gray-50 pt-16">
              {children}
            </main>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
