import { getServerI18n, localizeMetadata } from "@/lib/i18n/server";
import { AuthScreen } from "@/components/auth/AuthScreen";

export async function generateMetadata() {
  const { t } = await getServerI18n();
  return localizeMetadata({ title: "تۆمارکردن | دەرفەت" }, t);
}

export default function RegisterPage({ searchParams }) {
  return <AuthScreen mode="register" searchParams={searchParams} />;
}
