"use client";

import { useCategories } from "@/hooks/useInventory";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Categories</h1>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4"
            >
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-sm text-gray-500">{cat.description ?? "No description"}</p>
                <p className="text-xs text-gray-400 mt-1">{cat._count?.items ?? 0} items</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}