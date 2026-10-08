export const TASK_CATEGORIES = [
  { value: "programmer", label: "Programmer", name: "پڕۆگرامساز" },
  { value: "photographer", label: "Photographer", name: "وێنەگر" },
  { value: "designer", label: "Designer", name: "دیزاینەر" },
  { value: "writer", label: "Writer", name: "نووسەر" },
  { value: "general", label: "General", name: "گشتی" },
];
export const TASK_DIFFICULTIES = [
  { value: "beginner", label: "Beginner", name: "سەرەتایی" },
  { value: "intermediate", label: "Intermediate", name: "مامناوەند" },
  { value: "advanced", label: "Advanced", name: "پێشکەوتوو" },
];
export const TASK_STATUSES = {
  available: { label: "Available", name: "بەردەست", variant: "primary" },
  in_progress: { label: "In Progress", name: "لە جێبەجێکردندایە", variant: "warning" },
  submitted: { label: "Submitted", name: "نێردراو", variant: "default" },
  reviewed: { label: "Reviewed", name: "هەڵسەنگێنراو", variant: "success" },
};
export const HISTORY_PAGE_SIZE = 20;
