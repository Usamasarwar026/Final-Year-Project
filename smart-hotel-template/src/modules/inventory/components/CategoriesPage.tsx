"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useInventory";
import {
  Plus,
  X,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Package,
  UtensilsCrossed,
  Brush,
  Beer,
  Wrench,
  ShoppingCart,
  Droplet,
  Beef,
  Wheat,
  IceCream,
  Utensils,
  ShowerHead,
} from "lucide-react";
import type { InventoryCategory } from "@/types/inventory";

const ICONS = [
  { name: "Package", Component: Package },
  { name: "UtensilsCrossed", Component: UtensilsCrossed },
  { name: "Brush", Component: Brush },
  { name: "Beer", Component: Beer },
  { name: "Wrench", Component: Wrench },
  { name: "ShoppingCart", Component: ShoppingCart },
  { name: "Droplet", Component: Droplet },
  { name: "Beef", Component: Beef },
  { name: "Wheat", Component: Wheat },
  { name: "IceCream", Component: IceCream },
  { name: "Utensils", Component: Utensils },
  { name: "ShowerHead", Component: ShowerHead },
];

const EMPTY_FORM = { name: "", description: "", icon: "Package" };

const getIconComponent = (iconName: string) => {
  const icon = ICONS.find((i) => i.name === iconName);
  return icon?.Component || Package;
};

export default function CategoriesPage() {
  const { categories, loading, createCategory, updateCategory } =
    useCategories();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat: InventoryCategory) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      icon: cat.icon ?? "Package",
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name required hai!");
      return;
    }
    setSaving(true);
    setError("");

    const result = editTarget
      ? await updateCategory(editTarget.id, {
          name: form.name.trim(),
          description: form.description || undefined,
          icon: form.icon || "Package",
        })
      : await createCategory({
          name: form.name.trim(),
          description: form.description || undefined,
          icon: form.icon || "Package",
        });

    setSaving(false);
    if (result.ok) {
      closeModal();
    } else {
      setError(result.error ?? "Failed to save category");
    }
  };

  const toggleStatus = async (cat: InventoryCategory) => {
    await updateCategory(cat.id, { is_active: !cat.is_active });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Categories
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          No categories yet — add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = getIconComponent(cat.icon || "Package");
            return (
              <div
                key={cat.id}
                className={`bg-white border rounded-xl p-5 flex items-center gap-4 ${cat.is_active ? "border-gray-200" : "border-gray-100 opacity-60"}`}
              >
                <Icon className="w-8 h-8 text-slate-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {cat.description ?? "No description"}
                  </p>
                  <span
                    className={`text-xs font-medium ${cat.is_active ? "text-green-600" : "text-red-500"}`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(cat)}
                    title={cat.is_active ? "Deactivate" : "Activate"}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      cat.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 rounded-full bg-white shadow-md transition-all duration-200 ${
                        cat.is_active ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editTarget ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={closeModal}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Category Name *</label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="e.g. Kitchen Supplies"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ICONS.map((icon) => (
                    <button
                      key={icon.name}
                      onClick={() =>
                        setForm((p) => ({ ...p, icon: icon.name }))
                      }
                      className={`p-2 rounded-lg border-2 transition ${form.icon === icon.name ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <icon.Component className="w-6 h-6 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Description</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editTarget ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
