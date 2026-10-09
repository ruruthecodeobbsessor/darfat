import { Rubik, Vazirmatn } from "next/font/google";
import "../globals.css";
import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";
import { AuthNavbar } from "@/components/auth/AuthNavbar";
import { Footer } from "@/components/Footer";
import { MotionProvider } from "@/components/ui/animations";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LANGUAGES, isLocale, localeDirection } from "@/lib/i18n/config";
import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { notFound } from "next/navigation";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const rubik = Rubik({
  subsets: ["arabic", "latin"],
  style: ["normal", "italic"],
  variable: "--font-rubik",
  display: "swap",
});



const baseMetadata = {
  title: {
    default: "دەرفەت | پلاتفۆرمی دەرفەتەکان بۆ گەنجانی کوردستان",
    template: "%s | دەرفەت",
  },
  description:
    "پلاتفۆرمێکی زیرەک بۆ دۆزینەوەی دەرفەتەکانی گەشەپێدان (هاکاسۆن، کاری خۆبەخشی، پێشبڕکێ، وۆرکشۆپ و کڵاب) بۆ گەنجان لە کوردستان و عێراق.",
  keywords: ["دەرفەت", "کوردستان", "هاکاسۆن", "خۆبەخشی", "وۆرکشۆپ", "گەنجان", "Darfat", "Derfet"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata(baseMetadata, t);
}

export function generateStaticParams() {
  return LANGUAGES.map(({ code }) => ({ locale: code }));
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} dir={localeDirection(locale)} className={`${vazirmatn.variable} ${rubik.variable}`}>
      <body
        className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        <LocaleProvider locale={locale}>
        <MotionProvider>
          <Suspense fallback={<Navbar />}>
            <AuthNavbar />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
