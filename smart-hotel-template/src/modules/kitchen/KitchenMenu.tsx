// app/admin/kitchen/menu/page.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  Utensils,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Star,
  Image as ImageIcon,
  Upload,
  CircleOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import {
  useKitchenMenu,
  useKitchenCategories,
  useCreateFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
} from "@/hooks/useKitchen";
import type { FoodItem, FoodCategory } from "@/types/kitchen";
import Image from "next/image";

// Add this ABOVE the main `KitchenCategories` component (same place Rooms.tsx defines it)
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

function Pagination({
  page,
  totalPages,
  total,
  limit,
  isFetching,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: PageSize;
  isFetching: boolean;
  onPageChange: (p: number) => void;
  onLimitChange: (l: PageSize) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const navBtn = (disabled: boolean) =>
    clsx(
      "h-8 w-8 flex items-center justify-center rounded-lg border border-border text-xs transition-colors",
      disabled
        ? "text-muted-foreground/30 bg-muted/30 cursor-not-allowed"
        : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer",
    );

  return (
    <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {total === 0 ? (
            "No categories"
          ) : (
            <>
              {" "}
              Showing{" "}
              <span className="font-medium text-foreground">
                {from}–{to}
              </span>{" "}
              of <span className="font-medium text-foreground">{total}</span>
            </>
          )}
        </span>
        {isFetching && (
          <Loader2 size={11} className="animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Rows per page
          </span>
          <select
            value={limit}
            onChange={(e) => {
              onLimitChange(Number(e.target.value) as PageSize);
              onPageChange(1);
            }}
            className="h-7 px-2 pr-6 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-4 bg-border" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={navBtn(page === 1)}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">
              {totalPages || 1}
            </span>
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={navBtn(page >= totalPages)}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Image Upload Component ───────────────────────────────────────────────────
function ImageUpload({
  currentImage,
  onImageUpload,
  isUploading,
}: {
  currentImage: string | null;
  onImageUpload: (url: string) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/kitchen/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        onImageUpload(data.url);
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
        Item Image
      </label>
      <div className="flex items-center gap-4">
        {currentImage ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <Image
              src={currentImage}
              alt="Preview"
              fill
              className="object-cover"
              sizes="80px"
            />
            <button
              type="button"
              onClick={() => onImageUpload("")}
              className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border bg-muted/20 flex items-center justify-center">
            <ImageIcon size={24} className="text-muted-foreground" />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Upload size={14} />
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// Menu Table Row Component
function MenuTableRow({
  item,
  onEdit,
  onDelete,
  index,
}: {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
  onDelete: (id: number) => void;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={clsx(
        "border-b border-border hover:bg-muted/30 transition-colors",
        !item.active && "opacity-60",
      )}
    >
      <td className="px-3 py-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/20">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils size={20} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[250px]">
              {item.description}
            </p>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="text-xs text-muted-foreground">
          {item.category?.name || `Category ${item.category_id}`}
        </span>
      </td>
      <td className="px-3 py-3">
        <span className="font-semibold text-foreground">
          PKR {Number(item.price).toLocaleString()}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={12} />
          {item.preparation_time_minutes} min
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="space-y-1">
          {item.availability_status ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
              <CheckCircle size={10} /> Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
              <AlertCircle size={10} /> Unavailable
            </span>
          )}
          {item.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
              <Star size={10} /> Featured
            </span>
          )}
          {!item.active && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
              <CircleOff size={10} /> Inactive
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              console.log("Edit clicked for item:", item);
              onEdit(item);
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit2
              size={14}
              className="text-muted-foreground hover:text-primary"
            />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2
              size={14}
              className="text-muted-foreground hover:text-red-500"
            />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Menu Item Form Modal ─────────────────────────────────────────
function MenuItemFormModal({
  isOpen,
  onClose,
  editingItem,
  categories,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingItem: FoodItem | null;
  categories: FoodCategory[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    image: "",
    price: "",
    preparation_time_minutes: 15,
    ingredients_text: "",
    availability_status: true,
    featured: false,
    active: true,
  });
  const [isUploading, setIsUploading] = useState(false);

  const createItem = useCreateFoodItem();
  const updateItem = useUpdateFoodItem();
  const isEditing = !!editingItem;

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image: url });
  };

  useEffect(() => {
    if (editingItem) {
      console.log("Setting form data for editing:", editingItem);
      setFormData({
        name: editingItem.name,
        category_id: String(editingItem.category_id),
        description: editingItem.description || "",
        image: editingItem.image || "",
        price: String(editingItem.price),
        preparation_time_minutes: editingItem.preparation_time_minutes,
        ingredients_text: editingItem.ingredients_text || "",
        availability_status: editingItem.availability_status,
        featured: editingItem.featured,
        active: editingItem.active,
      });
    } else {
      setFormData({
        name: "",
        category_id: "",
        description: "",
        image: "",
        price: "",
        preparation_time_minutes: 15,
        ingredients_text: "",
        availability_status: true,
        featured: false,
        active: true,
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category_id: parseInt(formData.category_id),
      description: formData.description.trim() || undefined,
      image: formData.image.trim() || undefined,
      price: Number(formData.price),
      preparation_time_minutes: formData.preparation_time_minutes,
      ingredients_text: formData.ingredients_text.trim() || undefined,
      availability_status: formData.availability_status,
      featured: formData.featured,
      active: formData.active,
    };

    // MenuItemFormModal.handleSubmit — remove duplicate toast + extra refetch
    try {
      if (isEditing && editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, payload });
      } else {
        await createItem.mutateAsync(payload);
      }
      // useCreateFoodItem/useUpdateFoodItem already invalidate + toast
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
        className="relative z-10 w-full max-w-3xl bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Image Upload */}
          <ImageUpload
            currentImage={formData.image}
            onImageUpload={handleImageUpload}
            isUploading={isUploading}
          />

          {/* Basic Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Chicken Biryani"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              {/* Category Select - Sirf active categories */}
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                {categories
                  .filter((cat) => cat.active !== false)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the dish, key ingredients, serving style..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Price & Prep Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Price (PKR) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Prep Time (minutes)
              </label>
              <div className="relative">
                <Clock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="number"
                  value={formData.preparation_time_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preparation_time_minutes: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
              Ingredients
            </label>
            <textarea
              value={formData.ingredients_text}
              onChange={(e) =>
                setFormData({ ...formData, ingredients_text: e.target.value })
              }
              placeholder="List main ingredients (e.g., Chicken, Rice, Spices, Yogurt)"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Status Toggles - FIXED COLORS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Available Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Available</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    availability_status: !formData.availability_status,
                  })
                }
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  formData.availability_status
                    ? "bg-emerald-500 shadow-sm"
                    : "bg-gray-400 dark:bg-gray-600",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    formData.availability_status ? "right-0.5" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Featured</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, featured: !formData.featured })
                }
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  formData.featured
                    ? "bg-amber-500 shadow-sm"
                    : "bg-gray-400 dark:bg-gray-600",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    formData.featured ? "right-0.5" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Active Status</span>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, active: !formData.active })
                }
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-all duration-200",
                  formData.active
                    ? "bg-primary shadow-sm"
                    : "bg-gray-400 dark:bg-gray-600",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200",
                    formData.active ? "right-0.5" : "left-0.5",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createItem.isPending || updateItem.isPending}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createItem.isPending || updateItem.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>{isEditing ? "Update Item" : "Create Item"}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  isOpen,
  onClose,
  itemName,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
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
            Delete Menu Item
          </h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">"{itemName}"</span>?
            This action cannot be undone.
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

// ─── Main Menu Page ──────────────────────────────────────────────────────────
export default function KitchenMenu() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FoodItem | null>(null);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isFetching,
  } = useKitchenCategories();
  const {
    data: items = [],
    isLoading: itemsLoading,
    refetch,
  } = useKitchenMenu({
    category_id: selectedCategory || undefined,
    available: showOnlyAvailable ? true : undefined,
    featured: showOnlyFeatured ? true : undefined,
    active: true,
    q: searchQuery || undefined,
  });
  const deleteItem = useDeleteFoodItem();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(item.description?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        )
      ) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery]);

  // Main component — handleDelete + handleFormClose
  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      // useDeleteFoodItem already invalidates + toasts
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete item");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Handle edit click - FIXED
  const handleEditClick = (item: FoodItem) => {
    console.log("Opening edit modal for:", item);
    setEditingItem(item);
    setShowForm(true);
  };

  // Stats
  const totalItems = items.length;
  const availableItems = items.filter((i) => i.availability_status).length;
  const featuredItems = items.filter((i) => i.featured).length;
  // after filteredCategories — pagination state (replace any earlier simple page state)

  // after filteredItems useMemo — add pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(10);
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, showOnlyAvailable, showOnlyFeatured]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Utensils className="text-primary" size={28} />
              Menu Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your restaurant menu items, prices, and availability
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowForm(true);
            }}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Plus size={18} />
            Add Menu Item
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
            <p className="text-2xl font-bold text-emerald-600">
              {availableItems}
            </p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-2xl p-4 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-600">{featuredItems}</p>
            <p className="text-xs text-muted-foreground">Featured</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={selectedCategory || ""}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
          >
            <option value="">All Categories</option>
            {categories
              .filter((cat) => cat.active !== false)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>

          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={clsx(
              "px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors",
              showOnlyAvailable
                ? "bg-emerald-500 text-white"
                : "border border-border bg-background hover:bg-muted",
            )}
          >
            <CheckCircle size={14} />
            Available
          </button>

          <button
            onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
            className={clsx(
              "px-3 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors",
              showOnlyFeatured
                ? "bg-amber-500 text-white"
                : "border border-border bg-background hover:bg-muted",
            )}
          >
            <Star size={14} />
            Featured
          </button>

          {(searchQuery ||
            selectedCategory ||
            showOnlyAvailable ||
            showOnlyFeatured) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowOnlyAvailable(false);
                setShowOnlyFeatured(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Menu Items Table */}
        {itemsLoading || categoriesLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">
              Loading menu items...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <Utensils
              size={48}
              className="mx-auto text-muted-foreground/30 mb-3"
            />
            <p className="text-sm font-semibold text-foreground/70">
              No menu items found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Add your first menu item to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowForm(true);
                }}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Plus size={14} /> Add Menu Item
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Image
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Prep Time
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedItems.map((item, idx) => (
                    <MenuTableRow
                      key={item.id}
                      item={item}
                      onEdit={handleEditClick}
                      onDelete={(id) => {
                        const itemToDelete = items.find((i) => i.id === id);
                        if (itemToDelete) setDeletingItem(itemToDelete);
                      }}
                      index={idx}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={filteredItems.length}
              limit={limit}
              isFetching={isFetching}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {showForm && (
          <MenuItemFormModal
            key="menu-form-modal"
            isOpen={showForm}
            onClose={handleFormClose}
            editingItem={editingItem}
            categories={categories}
            onSuccess={refetch}
          />
        )}
        {deletingItem && (
          <DeleteConfirmModal
            key="menu-delete-modal"
            isOpen={!!deletingItem}
            onClose={() => setDeletingItem(null)}
            itemName={deletingItem.name}
            onConfirm={handleDelete}
            isLoading={deleteItem.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
