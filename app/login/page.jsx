import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata = { title: "چوونەژوورەوە | دەرفەت" };

export default function LoginPage({ searchParams }) {
  return <AuthScreen mode="login" searchParams={searchParams} />;
}
