import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Plot de gráficos DRX",
  description: "Análise e correlação de difratogramas de raios X.",
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

          bg-background
          text-text-primary

          font-sans
          antialiased
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
