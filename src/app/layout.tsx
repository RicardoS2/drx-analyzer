import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TESTE APP DE GRAFICO LAB_ECO",
  description: "Análise avançada e acadêmica de difratogramas de raios X",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="min-h-full">
      <body
        className="
          min-h-screen
          w-full
          min-w-0
          max-w-full

          overflow-x-hidden

          bg-[#F8F7F4]
          text-[#353638]

          font-sans
          antialiased

          selection:bg-[#C9C5BC]
          selection:text-[#353638]
        "
      >
        <main
          className="
            min-h-screen
            w-full
            min-w-0
            max-w-full
            overflow-x-hidden
          "
        >
          {children}
        </main>
      </body>
    </html>
  );
}
