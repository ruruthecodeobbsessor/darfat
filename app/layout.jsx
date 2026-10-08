import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";
import { AuthNavbar } from "@/components/auth/AuthNavbar";
import { Footer } from "@/components/Footer";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata = {
  title: "دەرفەت | پلاتفۆرمی دەرفەتەکان بۆ گەنجانی کوردستان",
  description:
    "پلاتفۆرمێکی زیرەک بە ژیریی دەستکرد بۆ دۆزینەوەی دەرفەتەکانی گەشەپێدان (هاکاسۆن، کاری خۆبەخشی، پێشبڕکێ، وۆرکشۆپ و کڵاب) بۆ گەنجان لە کوردستان و عێراق.",
  keywords: ["دەرفەت", "کوردستان", "هاکاسۆن", "خۆبەخشی", "وۆرکشۆپ", "گەنجان", "Derfet"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ckb" dir="rtl" className={vazirmatn.variable}>
      <body
        className={`${vazirmatn.className} min-h-screen flex flex-col bg-slate-50/70 text-slate-900 selection:bg-orange-500 selection:text-white antialiased`}
      >
        <Suspense fallback={<Navbar />}>
          <AuthNavbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
