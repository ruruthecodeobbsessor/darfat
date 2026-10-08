import { taskApi } from "@/lib/tasks/api";
import { createGeneratedTask } from "@/lib/tasks/server";
import { generationInput } from "@/lib/tasks/validation";

export const maxDuration = 60;
export async function POST(request) {
  return taskApi(request, async (userId, body) => ({ task: await createGeneratedTask(userId, generationInput(body)) }));
}
