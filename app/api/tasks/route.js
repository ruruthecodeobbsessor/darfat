import { taskApi } from "@/lib/tasks/api";
import { loadTasks } from "@/lib/tasks/server";
import { TaskError } from "@/lib/tasks/validation";

export async function GET(request) {
  return taskApi(request, (userId) => {
    const offset = Number(new URL(request.url).searchParams.get("offset") || 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000) throw new TaskError("داواکارییەکە دروست نییە.");
    return loadTasks(userId, offset);
  });
}
