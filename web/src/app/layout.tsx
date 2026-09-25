import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PetPrice.ee - Lemmikloomakaupade hinnavõrdlus",
  description:
    "Võrdle koera- ja kassitoidu hindu ning ühikuhindu (€/kg) Eesti e-poodides: PetCity, Kika, Zoomaailm, Fera, Koerland ja Zooplus. Vali odavaim pood ja säästa PetPrice abil.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "lemmikloomatoit",
    "koeratoit",
    "kassitoit",
    "hinnavõrdlus",
    "petcity",
    "kika",
    "zoomaailm",
    "fera",
    "koerland",
    "zooplus",
    "odav koeratoit",
    "royal canin",
    "acana",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="et" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
