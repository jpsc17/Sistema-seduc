import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Resultados Educacionais e Índice de Bônus das DREs e Escolas Estaduais — SEDUC-PA",
  description:
    "Portal oficial de consulta, auditoria e acompanhamento de resultados educacionais, metas do IDEB e índices de bonificação das escolas estaduais do Pará — Exercício 2025.",
  keywords: [
    "SEDUC-PA",
    "Educação Pará",
    "Bônus Escolar",
    "IDEB",
    "DRE",
    "Resultados Educacionais",
    "Transparência",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-[#F6F6F6] text-[#1D1D1B] min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
