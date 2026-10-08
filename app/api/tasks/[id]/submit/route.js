import { taskApi } from "@/lib/tasks/api";
import { submitTask } from "@/lib/tasks/server";
import { taskId, submissionInput } from "@/lib/tasks/validation";

export const maxDuration = 120;
export async function POST(request, { params }) {
  const { id } = await params;
  return taskApi(request, (userId, body) => submitTask(userId, taskId(id), { ...submissionInput(body), files: body.files }), { multipart: true });
}
