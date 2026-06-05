// src/lib/generator/templateEngine.ts
// Placeholder replacement engine

export type TemplateVars = {
  WEBSITE_NAME: string;        // "Grand Palace Hotel"
  WEBSITE_SLUG: string;        // "grand-palace-hotel"
  GENERATED_AT: string;        // "2025-01-01"
};

// Replace all {{PLACEHOLDER}} in file content
export function processTemplate(content: string, vars: TemplateVars): string {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

// Convert display name to slug
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Build template vars from user input
export function buildVars(websiteName: string): TemplateVars {
  return {
    WEBSITE_NAME: websiteName,
    WEBSITE_SLUG: toSlug(websiteName),
    GENERATED_AT: new Date().toISOString().split("T")[0],
  };
}