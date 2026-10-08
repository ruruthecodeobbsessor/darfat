// Keep authentication independent of private columns added to profiles.
// Email comes from the verified Auth user, not the directory-visible table.
export const AUTH_PROFILE_COLUMNS = [
  "id", "name", "role", "created_at", "city", "age", "interests", "skills",
  "bio", "avatar_url", "onboarding_completed", "headline",
].join(", ");
