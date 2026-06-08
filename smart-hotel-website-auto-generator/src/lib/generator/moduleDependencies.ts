// src/lib/generator/moduleDependencies.ts

import { ModuleId } from "./moduleFiles";

/**
 * MODULE DEPENDENCY GRAPH
 * Key = module jo select kiya
 * Value = modules jo AUTO-SELECT ho jayenge (UI level pe)
 * 
 * Ye sirf UI ke liye hai - generator ko force nahi karta
 */
export const MODULE_DEPENDENCIES: Partial<Record<ModuleId, ModuleId[]>> = {
  booking: ["rooms", "customer"],     // Booking requires Rooms + Customer
  billing: ["booking"],               // Billing requires Booking
  housekeeping: ["rooms"],            // Housekeeping requires Rooms
  reports: ["booking", "rooms"],      // Reports requires Booking + Rooms
};

/**
 * Reverse map: kaun si modules is module ko require karti hain
 */
export function getRequiredBy(
  moduleId: ModuleId,
  selectedModules: ModuleId[]
): ModuleId[] {
  const requiredBy: ModuleId[] = [];
  for (const [mod, deps] of Object.entries(MODULE_DEPENDENCIES)) {
    if (deps?.includes(moduleId) && selectedModules.includes(mod as ModuleId)) {
      requiredBy.push(mod as ModuleId);
    }
  }
  return requiredBy;
}

/**
 * Recursively resolve all dependencies (for UI display)
 */
export function resolveDependencies(modules: ModuleId[]): ModuleId[] {
  const resolved = new Set<ModuleId>(modules);
  
  let changed = true;
  while (changed) {
    changed = false;
    for (const mod of [...resolved]) {
      const deps = MODULE_DEPENDENCIES[mod] ?? [];
      for (const dep of deps) {
        if (!resolved.has(dep)) {
          resolved.add(dep);
          changed = true;
        }
      }
    }
  }
  
  // Authentication is always required
  resolved.add("authentication");
  
  return [...resolved];
}

/**
 * Get dependency description for UI display
 */
export function getDependencyDescription(moduleId: ModuleId): string | null {
  const deps = MODULE_DEPENDENCIES[moduleId];
  if (!deps || deps.length === 0) return null;
  return `Requires: ${deps.join(" + ")}`;
}