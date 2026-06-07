// src/app/admin/kitchen/categories/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  FolderTree,
  Utensils,
  CheckCircle,
  AlertCircle,
  CircleX,
  CircleOff,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  useKitchenCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useKitchen";
import type { FoodCategory } from "@/types/kitchen";

function CategoryRow({
  category,
  onEdit,
  onDelete,
  index,
}: {
  category: FoodCategory;
  onEdit: (cat: FoodCategory) => void;
  onDelete: (id: number) => void;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={clsx(
        "border-b border-border hover:bg-muted/30 transition-colors",
        category.active === false && "opacity-60",
      )}
    >
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-foreground">{category.name}</p>
          {category.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[300px]">
              {category.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {category.active !== false ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle size={10} /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
            <CircleOff size={10} /> Inactive
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(category.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Category Form Modal ──────────────────────────────────────────────────────
function CategoryFormModal({
  isOpen,
  onClose,
  editingCategory,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: FoodCategory | null;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const isEditing = !!editingCategory;

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || "");
      setActive(editingCategory.active === undefined ? true : editingCategory.active);
    } else {
      setName("");
      setDescription("");
      setActive(true);
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (isEditing && editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            active: active,
          },
        });
        toast.success("Category updated successfully");
      } else {
        await createCategory.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast.success("Category created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Operation failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-md bg-background rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <FolderTree size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Category" : "New Category"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Breakfast, Lunch, Dinner"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Active Toggle */}
          {isEditing && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Active Status</span>
              <button
                type="button"
                onClick={() => setActive(!active)}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  active
                    ? "bg-emerald-500 shadow-sm"
                    : "bg-gray-300 dark:bg-gray-600",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    active ? "right-0.5" : "left-0.5",
                  )}
                />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createCategory.isPending || updateCategory.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>{isEditing ? "Update" : "Create"} Category</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  isOpen,
  onClose,
  categoryName,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-sm bg-background rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={28} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Delete Category
          </h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{categoryName}"
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Categories Page ─────────────────────────────────────────────────────
export default function KitchenCategories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState<FoodCategory | null>(
    null,
  );

  const { data: categories = [], isLoading, refetch } = useKitchenCategories();
  const deleteCategory = useDeleteCategory();

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ),
  );

  const handleEdit = (cat: FoodCategory) => {
    setEditingCategory(cat);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success("Category deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete category");
    } finally {
      setDeletingCategory(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
    refetch();
  };

  // Stats for header
  const activeCount = categories.filter((c) => c.active !== false).length;
  const inactiveCount = categories.filter((c) => c.active === false).length;
  const totalItems = categories.reduce(
    (sum, c) => sum + (c.foodItems?.length || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <FolderTree className="text-primary" size={28} />
              Food Categories
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Organize your menu items into categories for better customer
              experience
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowForm(true);
            }}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {categories.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Categories
                </p>
              </div>
              <FolderTree size={32} className="text-primary/40" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {activeCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active Categories
                </p>
              </div>
              <CheckCircle size={32} className="text-emerald-500/40" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {totalItems}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Menu Items
                </p>
              </div>
              <Utensils size={32} className="text-amber-500/40" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Categories Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <FolderTree
              size={48}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-sm font-semibold text-foreground/70">
              No categories found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Create your first category to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowForm(true);
                }}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus size={14} /> Add Category
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((category, idx) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={(id) => {
                        const cat = categories.find((c) => c.id === id);
                        if (cat) setDeletingCategory(cat);
                      }}
                      index={idx}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Details */}
            <div className="px-4 py-3 border-t border-border bg-muted/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  Showing {filteredCategories.length} of {categories.length}{" "}
                  categories
                </span>
                {inactiveCount > 0 && (
                  <span className="flex items-center gap-1">
                    <AlertCircle size={12} />
                    {inactiveCount} inactive{" "}
                    {inactiveCount === 1 ? "category" : "categories"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Quick Stats:</span>

                <span className="flex items-center gap-1">
                  <CheckCircle size={12} /> Active: {activeCount}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CircleX size={12} /> Inactive: {inactiveCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <CategoryFormModal
            isOpen={showForm}
            onClose={handleFormClose}
            editingCategory={editingCategory}
            onSuccess={refetch}
          />
        )}
        {deletingCategory && (
          <DeleteConfirmModal
            isOpen={!!deletingCategory}
            onClose={() => setDeletingCategory(null)}
            categoryName={deletingCategory.name}
            onConfirm={handleDelete}
            isLoading={deleteCategory.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
