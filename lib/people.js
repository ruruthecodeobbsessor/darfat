// People suggestions: score others by shared skills, shared interests and closeness in age.

const WEIGHTS = { skills: 40, interests: 40, age: 20 };
const AGE_RANGE = 10; // years apart at which the age score reaches 0

const normalize = (value) => String(value ?? "").trim().toLowerCase();

function shared(mine = [], theirs = []) {
  const theirSet = new Map(theirs.map((item) => [normalize(item), item]));
  return mine.filter((item) => theirSet.has(normalize(item))).map((item) => theirSet.get(normalize(item)));
}

// 0..1 — share of the smaller list that overlaps, so one shared item out of two counts a lot.
function overlapScore(count, a = [], b = []) {
  const smaller = Math.min(a.length, b.length);
  return smaller ? Math.min(1, count / smaller) : 0;
}

export function matchPerson(me, person) {
  const sharedSkills = shared(me.skills, person.skills);
  const sharedInterests = shared(me.interests, person.interests);
  const ageGap = Number.isInteger(me.age) && Number.isInteger(person.age) ? Math.abs(me.age - person.age) : null;

  const score = Math.round(
    WEIGHTS.skills * overlapScore(sharedSkills.length, me.skills, person.skills) +
      WEIGHTS.interests * overlapScore(sharedInterests.length, me.interests, person.interests) +
      WEIGHTS.age * (ageGap === null ? 0 : Math.max(0, 1 - ageGap / AGE_RANGE))
  );

  return { score, sharedSkills, sharedInterests, ageGap };
}

// Best matches first; people with nothing in common are left out.
export function suggestPeople(me, people, limit = 30) {
  return people
    .map((person) => ({ ...person, match: matchPerson(me, person) }))
    .filter(({ match }) => match.score > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit);
}
