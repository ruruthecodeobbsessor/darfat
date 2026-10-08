function clean(items) {
  return [...new Set((Array.isArray(items) ? items : []).filter(item => typeof item === "string")
    .map(item => item.trim()).filter(item => item.length > 0 && item.length <= 120))].slice(0, 30);
}
export function profilePreferences(profile) {
  return { interests: clean(profile?.interests), skills: clean(profile?.skills) };
}
export function selectedProfileContext(profile, input) {
  const preferences = profilePreferences(profile);
  const { interest, skill } = input;
  if ((!interest && !skill) || (interest && !preferences.interests.includes(interest)) ||
      (skill && !preferences.skills.includes(skill))) return null;
  return { source: "profile_interests_and_skills", profile_id: profile.id, skill_id: null,
    ...preferences, selected_interest: interest || null, selected_skill: skill || null,
    difficulty: input.difficulty.value };
}
