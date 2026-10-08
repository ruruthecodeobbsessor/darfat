import { taskApi } from "@/lib/tasks/api";
import { startTask } from "@/lib/tasks/server";
import { taskId } from "@/lib/tasks/validation";

export async function POST(request, { params }) {
  const { id } = await params;
  return taskApi(request, async (userId) => ({ task: await startTask(userId, taskId(id)) }));
}
