import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";
import "./globals.css";

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-inter",
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Recall",
  description: "Подготовка к тестам: тренировка, экзамен и работа над ошибками",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={inter.variable}>
      <body>
        <Theme accentColor="crimson" panelBackground="solid" radius="large">
          {children}
        </Theme>
      </body>
    </html>
  );
}
