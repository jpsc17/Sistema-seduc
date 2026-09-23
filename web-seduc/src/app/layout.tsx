import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Painel SEDUC — Resultados Educacionais e Índice de Bônus 2025",
  description:
    "Sistema de consulta e auditoria dos resultados educacionais e índices de bônus das Diretorias Regionais de Ensino e Escolas Estaduais do Pará — Exercício 2025.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-[#F1F3F5] text-[#1A1A1A]`}>
        {children}
      </body>
    </html>
  );
}
