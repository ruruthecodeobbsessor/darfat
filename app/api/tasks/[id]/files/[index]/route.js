import { authorizeRequest } from "@/lib/auth/server";
import { taskId } from "@/lib/tasks/validation";
import { getTask } from "@/lib/tasks/server";
import { downloadFile } from "@/lib/tasks/storage";

export async function GET(_request, { params }) {
  const { identity, status } = await authorizeRequest();
  if (!identity) return new Response(null, { status });
  try {
    const { id, index } = await params;
    if (!/^\d{1,2}$/.test(index) || Number(index) >= 40) return new Response(null, { status: 404 });
    const assignment = await getTask(identity.user.id, taskId(id));
    const file = assignment.submission?.attachments?.[Number(index)];
    if (!file) return new Response(null, { status: 404 });
    const buffer = await downloadFile(identity.user.id, assignment.id, file);
    const filename = file.name.split("/").pop();
    const encoded = encodeURIComponent(filename).replace(/['()*]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(buffer, { headers: { "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`, "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" } });
  } catch { return new Response(null, { status: 404, headers: { "Cache-Control": "private, no-store" } }); }
}
