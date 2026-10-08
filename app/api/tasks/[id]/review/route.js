import { taskApi } from "@/lib/tasks/api";
import { reviewTask } from "@/lib/tasks/server";
import { taskId } from "@/lib/tasks/validation";

export const maxDuration = 60;
export async function POST(request, { params }) {
  const { id } = await params;
  return taskApi(request, (userId) => reviewTask(userId, taskId(id)));
}
