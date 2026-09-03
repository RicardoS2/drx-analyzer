import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TESTE APP DE GRAFICO LAB_ECO",
  description: "Análise avançada e acadêmica de difratogramas de raios X",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans text-[#353638] bg-[#F8F7F4] min-h-screen selection:bg-[#C9C5BC] selection:text-[#353638]">
        {children}
      </body>
    </html>
  );
}
