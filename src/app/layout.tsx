import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  variable: "--font-invitation",
  display: "swap",
});

export const metadata: Metadata = {
  title: "סנדרין | תכנון החתונה ברוגע",
  description:
    "פלטפורמה חמה ומדויקת לזוגות שמתחתנים באולם סנדרין: מוזמנים, אישורי הגעה והושבה.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
