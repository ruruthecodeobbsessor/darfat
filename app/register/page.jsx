import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata = { title: "تۆمارکردن | دەرفەت" };

export default function RegisterPage({ searchParams }) {
  return <AuthScreen mode="register" searchParams={searchParams} />;
}
