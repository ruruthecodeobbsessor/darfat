import { AdminNav } from "@/components/admin/AdminNav";
import { PageContainer } from "@/components/ui/page-header";

// Every admin page shares the section tabs. Access is enforced by the proxy and again in each page/action.
export default function AdminLayout({ children }) {
  return (
    <PageContainer size="xl">
      <div className="mb-8">
        <AdminNav />
      </div>
      {children}
    </PageContainer>
  );
}
