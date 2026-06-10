// // src/lib/generator/moduleDependencies.ts

// import { ModuleId } from "./moduleFiles";

// /**
//  * MODULE DEPENDENCY GRAPH
//  * Key = module jo select kiya
//  * Value = modules jo AUTO-SELECT ho jayenge (UI level pe)
//  * 
//  * Ye sirf UI ke liye hai - generator ko force nahi karta
//  */
// export const MODULE_DEPENDENCIES: Partial<Record<ModuleId, ModuleId[]>> = {
//   booking: ["rooms", "customer"],     // Booking requires Rooms + Customer
//   billing: ["booking"],               // Billing requires Booking
//   housekeeping: ["rooms"],            // Housekeeping requires Rooms
//   reports: ["booking", "rooms"],      // Reports requires Booking + Rooms
// };

// /**
//  * Reverse map: kaun si modules is module ko require karti hain
//  */
// export function getRequiredBy(
//   moduleId: ModuleId,
//   selectedModules: ModuleId[]
// ): ModuleId[] {
//   const requiredBy: ModuleId[] = [];
//   for (const [mod, deps] of Object.entries(MODULE_DEPENDENCIES)) {
//     if (deps?.includes(moduleId) && selectedModules.includes(mod as ModuleId)) {
//       requiredBy.push(mod as ModuleId);
//     }
//   }
//   return requiredBy;
// }

// /**
//  * Recursively resolve all dependencies (for UI display)
//  */
// export function resolveDependencies(modules: ModuleId[]): ModuleId[] {
//   const resolved = new Set<ModuleId>(modules);
  
//   let changed = true;
//   while (changed) {
//     changed = false;
//     for (const mod of [...resolved]) {
//       const deps = MODULE_DEPENDENCIES[mod] ?? [];
//       for (const dep of deps) {
//         if (!resolved.has(dep)) {
//           resolved.add(dep);
//           changed = true;
//         }
//       }
//     }
//   }
  
//   // Authentication is always required
//   resolved.add("authentication");
  
//   return [...resolved];
// }

// /**
//  * Get dependency description for UI display
//  */
// export function getDependencyDescription(moduleId: ModuleId): string | null {
//   const deps = MODULE_DEPENDENCIES[moduleId];
//   if (!deps || deps.length === 0) return null;
//   return `Requires: ${deps.join(" + ")}`;
// }



// src/lib/generator/moduleDependencies.ts

import { ModuleId } from "./moduleFiles";

/**
 * MODULE DEPENDENCY GRAPH
 * Key = module jo select kiya
 * Value = modules jo AUTO-SELECT ho jayenge (user cannot remove)
 */
export const MODULE_DEPENDENCIES: Partial<Record<ModuleId, ModuleId[]>> = {
  // Booking requires Rooms and Customer
  booking: ["rooms", "customer"],
  
  // Billing requires Booking (which already requires rooms + customer)
  billing: ["booking"],
  
  // Housekeeping requires Rooms
  housekeeping: ["rooms"],
  
  // Reports requires Booking and Rooms
  reports: ["booking", "rooms"],
};

/**
 * Get reverse dependencies - konsi modules is module ko require karti hain
 */
export function getReverseDependencies(moduleId: ModuleId): ModuleId[] {
  const reverseDeps: ModuleId[] = [];
  for (const [mod, deps] of Object.entries(MODULE_DEPENDENCIES)) {
    if (deps?.includes(moduleId)) {
      reverseDeps.push(mod as ModuleId);
    }
  }
  return reverseDeps;
}

/**
 * Recursively resolve all dependencies (add dependencies)
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
  
  return [...resolved];
}

/**
 * Remove modules that are no longer needed when their parent is removed
 * Returns modules that should be removed because they have no remaining dependents
 */
export function getOrphanedModules(
  currentModules: ModuleId[],
  removedModule: ModuleId
): ModuleId[] {
  const orphaned: ModuleId[] = [];
  
  // Check each dependency if it still has any dependent modules
  const remainingModules = currentModules.filter(m => m !== removedModule);
  
  // Get all modules that were possibly auto-added as dependencies
  const allPossibleDeps = new Set<ModuleId>();
  for (const mod of remainingModules) {
    const deps = MODULE_DEPENDENCIES[mod] ?? [];
    for (const dep of deps) {
      allPossibleDeps.add(dep);
    }
  }
  
  // Check each dependency if it still has any module that requires it
  for (const dep of allPossibleDeps) {
    const dependents = getReverseDependencies(dep);
    const hasDependent = remainingModules.some(m => dependents.includes(m));
    
    if (!hasDependent && !remainingModules.includes(dep)) {
      // This dependency is no longer needed
      orphaned.push(dep);
    }
  }
  
  return orphaned;
}

/**
 * Get modules that are locked (cannot be removed)
 * A module is locked if it's a dependency of any selected module
 */
export function getLockedModules(selectedModules: ModuleId[]): Set<ModuleId> {
  const locked = new Set<ModuleId>();
  
  // Find all dependencies of selected modules
  for (const mod of selectedModules) {
    const deps = MODULE_DEPENDENCIES[mod] ?? [];
    for (const dep of deps) {
      locked.add(dep);
    }
  }
  
  return locked;
}

/**
 * Check if a module can be toggled off
 */
export function canToggleOff(
  moduleId: ModuleId,
  currentSelected: ModuleId[],
  allSelected: ModuleId[]
): boolean {
  // Check if any selected module (other than this one) depends on this module
  const otherSelected = allSelected.filter(m => m !== moduleId);
  
  for (const mod of otherSelected) {
    const deps = MODULE_DEPENDENCIES[mod] ?? [];
    if (deps.includes(moduleId)) {
      return false; // This module is required by another selected module
    }
  }
  
  return true;
}

/**
 * Get dependency description for UI display
 */
export function getDependencyDescription(moduleId: ModuleId): string | null {
  const deps = MODULE_DEPENDENCIES[moduleId];
  if (!deps || deps.length === 0) return null;
  return `Requires: ${deps.join(" + ")}`;
}

/**
 * Get which modules depend on this module (for tooltip)
 */
export function getDependentModules(
  moduleId: ModuleId,
  selectedModules: ModuleId[]
): ModuleId[] {
  const dependents: ModuleId[] = [];
  for (const mod of selectedModules) {
    const deps = MODULE_DEPENDENCIES[mod] ?? [];
    if (deps.includes(moduleId) && mod !== moduleId) {
      dependents.push(mod);
    }
  }
  return dependents;
}

/**
 * Get all dependencies of a module (direct only)
 */
export function getDirectDependencies(moduleId: ModuleId): ModuleId[] {
  return MODULE_DEPENDENCIES[moduleId] ?? [];
}