import type { Metadata } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/Toaster";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LAMTUE — Liga Acadêmica de Medicina de Trauma, Urgência e Emergência",
  description:
    "Portal oficial da LAMTUE, Liga Acadêmica de Medicina de Trauma, Urgência e Emergência da URI Erechim, vinculada ao CAMED.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${inter.variable}`}>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
