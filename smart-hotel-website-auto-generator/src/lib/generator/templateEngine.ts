// // src/lib/generator/templateEngine.ts
// // Placeholder replacement engine

// export type TemplateVars = {
//   WEBSITE_NAME: string;        // "Grand Palace Hotel"
//   WEBSITE_SLUG: string;        // "grand-palace-hotel"
//   GENERATED_AT: string;        // "2025-01-01"
// };

// // Replace all {{PLACEHOLDER}} in file content
// export function processTemplate(content: string, vars: TemplateVars): string {
//   let result = content;
//   for (const [key, value] of Object.entries(vars)) {
//     const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
//     result = result.replace(regex, value);
//   }
//   return result;
// }

// // Convert display name to slug
// export function toSlug(name: string): string {
//   return name
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "");
// }

// // Build template vars from user input
// export function buildVars(websiteName: string): TemplateVars {
//   return {
//     WEBSITE_NAME: websiteName,
//     WEBSITE_SLUG: toSlug(websiteName),
//     GENERATED_AT: new Date().toISOString().split("T")[0],
//   };
// }
// src/lib/generator/templateEngine.ts

export type TemplateVars = {
  WEBSITE_NAME: string;
  WEBSITE_SLUG: string;
  [key: string]: string;
};

// ─── Build template variables from website name ────────────────
export function buildVars(websiteName: string): TemplateVars {
  return {
    WEBSITE_NAME: websiteName,
    WEBSITE_SLUG: websiteName.toLowerCase().replace(/\s+/g, "-"),
  };
}

// ─── Replace {{VAR_NAME}} placeholders ────────────────────────
export function processTemplate(content: string, vars: TemplateVars): string {
  return content.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => {
    return vars[key] ?? `{{${key}}}`;
  });
}

/**
 * ════════════════════════════════════════════════════════════════
 * MODULE-CONDITIONAL BLOCK PROCESSOR
 * ════════════════════════════════════════════════════════════════
 *
 * SUPPORTED SYNTAX (aur kuch nahi):
 *
 *   {{#if rooms}}                    <- single module
 *     ...code...
 *   {{/if}}
 *
 *   {{#if rooms+booking}}            <- AND: dono modules required
 *     ...code...
 *   {{/if}}
 *
 *   {{#if kitchen,inventory}}        <- OR: koi ek module kafi
 *     ...code...
 *   {{/if}}
 *
 *   {{#if tier_basic}}               <- tier === "basic"
 *   {{#if tier_intermediate}}        <- tier === "intermediate" OR "advanced"
 *   {{#if tier_advanced}}            <- tier === "advanced"
 *
 *   {{#if kitchen+tier_advanced}}    <- module AND tier combo
 *
 * NESTED BLOCKS supported (innermost-first, multi-pass).
 *
 * ❌ NOT SUPPORTED (use plain React/JS instead — see notes below):
 *   - {{else}} / {{else if ...}}
 *   - JS expressions: {{#if kpis.length > 0}}
 *   - HTML comments <!-- --> inside JSX (use {/* *\/} instead)
 *
 * Agar template mein invalid/unsupported {{#if}} syntax reh jaye,
 * yeh function THROW karega (silent pass-through nahi karega) —
 * taake broken marker generated project mein kabhi na jaye.
 * ════════════════════════════════════════════════════════════════
 */
export function processModuleBlocks(
  content: string,
  selectedModules: string[],
  tier: string,
  filePath: string = "",
): string {
  let result = content;
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50;

  // Matches an {{#if CONDITION}}...{{/if}} block that contains
  // NO nested {{#if inside it — i.e. an INNERMOST block.
  // CONDITION may only contain: letters, digits, underscore, comma, plus.
  const BLOCK_REGEX =
    /[ \t]*\{\{#if ([\w,+]+)\}\}[ \t]*\r?\n?((?:(?!\{\{#if)[\s\S])*?)[ \t]*\{\{\/if\}\}[ \t]*\r?\n?/g;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    result = result.replace(BLOCK_REGEX, (_match, condition: string, block: string) => {
      changed = true;
      const keep = evaluateCondition(condition, selectedModules, tier);
      return keep ? block : "";
    });
  }

  // Collapse 3+ blank lines down to a single blank line
  result = result.replace(/\n{3,}/g, "\n\n");

  // ── SAFETY CHECK ──────────────────────────────────────────────
  // Agar koi {{#if}} ya {{/if}} ya {{else}} reh gaya ho, iska matlab
  // template mein UNSUPPORTED syntax use hui hai. Silent pass-through
  // se generated project mein "Expected '</', got '#'" jaisi errors
  // aati hain — isliye yahi par fail karo, taake dev ko pata chale.
  if (/\{\{#if|\{\{\/if\}\}|\{\{else/.test(result)) {
    const snippet = extractBadMarkerContext(result);
    throw new Error(
      `[templateEngine] Invalid {{#if}} marker found in "${filePath || "template"}".\n` +
        `Supported syntax: {{#if module}}, {{#if moduleA+moduleB}}, {{#if moduleA,moduleB}}, ` +
        `{{#if tier_basic|tier_intermediate|tier_advanced}}.\n` +
        `NOT supported: {{else}}, {{else if}}, JS expressions like {{#if kpis.length > 0}}.\n` +
        `Use plain React conditionals ({condition && <div/>}) for runtime/data-driven logic instead.\n\n` +
        `Problem near:\n${snippet}`,
    );
  }

  return result;
}

// ─── Helper: extract a small snippet around the first bad marker ──
function extractBadMarkerContext(content: string): string {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/\{\{#if|\{\{\/if\}\}|\{\{else/.test(lines[i])) {
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 2);
      return lines
        .slice(start, end)
        .map((l, idx) => `  ${start + idx + 1}: ${l}`)
        .join("\n");
    }
  }
  return "(could not locate exact line)";
}

// ─── Condition evaluator ──────────────────────────────────────
function evaluateCondition(
  condition: string,
  selectedModules: string[],
  tier: string,
): boolean {
  // AND: rooms+booking — dono required
  if (condition.includes("+")) {
    return condition
      .split("+")
      .every((mod) => checkSingleCondition(mod.trim(), selectedModules, tier));
  }

  // OR: rooms,booking — koi ek kafi
  if (condition.includes(",")) {
    return condition
      .split(",")
      .some((mod) => checkSingleCondition(mod.trim(), selectedModules, tier));
  }

  return checkSingleCondition(condition.trim(), selectedModules, tier);
}

// ─── Single token checker ─────────────────────────────────────
function checkSingleCondition(
  token: string,
  selectedModules: string[],
  tier: string,
): boolean {
  if (token === "tier_basic") return tier === "basic";
  if (token === "tier_intermediate") return tier === "intermediate" || tier === "advanced";
  if (token === "tier_advanced") return tier === "advanced";

  return selectedModules.includes(token);
}