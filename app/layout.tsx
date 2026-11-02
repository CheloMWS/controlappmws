import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ControlApp MWS",
  description: "Sistema de Gestión y Trazabilidad de Requerimientos Técnicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="bg-[#0B0F19] text-gray-100 antialiased min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="flex-1 w-full">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}

