import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manga Translator AI",
  description: "Pipeline de traduccion de mangas con Gemini"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

