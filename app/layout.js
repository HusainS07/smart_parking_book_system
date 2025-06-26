import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionWrapper from "@/components/SessionWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SMART PARKING BOOKER",
  description: "Book your parking smartly",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`min-h-screen flex flex-col ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <Navbar />
          
          {/* Make main content grow to push footer down */}
          <main className="flex-grow">
            {children}
          </main>

          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
