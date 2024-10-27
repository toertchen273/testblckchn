import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Wallet } from "./Wallet";

export const metadata: Metadata = {
  title: "BlackRock Token",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Wallet>
      <ToastContainer/>
      </Wallet>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
