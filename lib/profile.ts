// Signup profile + onboarding survey options (shared by API routes + pages).
// Values are stored lowercase-slugs in db.json (users table).

export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Ecuador","Egypt",
  "Estonia","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece",
  "Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia",
  "Lebanon","Lithuania","Luxembourg","Malaysia","Maldives","Malta","Mexico",
  "Morocco","Myanmar","Nepal","Netherlands","New Zealand","Nigeria","Norway",
  "Oman","Pakistan","Palestine","Panama","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Saudi Arabia","Singapore","South Africa",
  "South Korea","Spain","Sri Lanka","Sweden","Switzerland","Taiwan","Thailand",
  "Turkey","UAE","Uganda","Ukraine","United Kingdom","United States","Uzbekistan",
  "Venezuela","Vietnam","Yemen","Zimbabwe","Other",
] as const;
export type Country = (typeof COUNTRIES)[number];

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
] as const;
export const GENDER_VALUES: string[] = GENDERS.map((g) => g.value);

export const HEAR_ABOUT = [
  { value: "google", label: "Google search" },
  { value: "youtube", label: "YouTube" },
  { value: "friend", label: "Friend / family" },
  { value: "social", label: "Social media (Facebook, X, Instagram…)" },
  { value: "github", label: "Developer community" },
  { value: "ads", label: "Advertisement" },
  { value: "other", label: "Other" },
] as const;
export const HEAR_ABOUT_VALUES: string[] = HEAR_ABOUT.map((h) => h.value);

export const GOALS = [
  { value: "cloud-builds", label: "Cloud builds", hint: "Compile apps & fix errors in the cloud" },
  { value: "game-studio", label: "Game Studio", hint: "Plan, build and play AI games" },
  { value: "mcp-agents", label: "MCP + AI agents", hint: "Connect agents via MCP" },
  { value: "exploring", label: "Just exploring", hint: "Looking around for now" },
] as const;
export const GOAL_VALUES: string[] = GOALS.map((g) => g.value);

export function cleanName(v: unknown, max = 60): string {
  return String(v || "")
    .replace(/[<>"'\\/;]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function nameError(v: string, field: string): string | null {
  if (!v) return `${field} is required.`;
  if (v.length < 2) return `${field} must be at least 2 characters.`;
  if (!/^\p{L}[\p{L}\p{M} .'-]*$/u.test(v)) return `${field} may contain letters, spaces, dots, hyphens and apostrophes only.`;
  return null;
}

export function countryError(v: string): string | null {
  if (!v) return "Country is required.";
  if (!(COUNTRIES as readonly string[]).includes(v)) return "Please pick a country from the list.";
  return null;
}

export function genderError(v: string): string | null {
  if (!v) return "Please select an option.";
  if (!GENDER_VALUES.includes(v)) return "Invalid option.";
  return null;
}

export function hearAboutError(v: string): string | null {
  if (!v) return "Please select an option.";
  if (!HEAR_ABOUT_VALUES.includes(v)) return "Invalid option.";
  return null;
}

export function goalError(v: string): string | null {
  if (!v) return "Please select an option.";
  if (!GOAL_VALUES.includes(v)) return "Invalid option.";
  return null;
}
