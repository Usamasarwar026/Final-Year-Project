// src/app/admin/kitchen/menu/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
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
  Filter,
  ChevronDown,
  Clock,
  Flame,
  Leaf,
  Star,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import Image from "next/image";
import {
  useKitchenMenu,
  useKitchenCategories,
  useCreateFoodItem,
  useUpdateFoodItem,
  useDeleteFoodItem,
} from "@/hooks/useKitchen";
import type { FoodItem, FoodCategory } from "@/types/kitchen";

// ─── Menu Item Card ──────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  onEdit,
  onDelete,
  categories,
}: {
  item: FoodItem;
  onEdit: (item: FoodItem) => void;
  onDelete: (id: number) => void;
  categories: FoodCategory[];
}) {
  const category = categories.find((c) => c.id === item.category_id);
  const spicyLevels = ["🌶️", "🌶️🌶️", "🌶️🌶️🌶️", "🌶️🌶️🌶️🌶️", "🌶️🌶️🌶️🌶️🌶️"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "group relative rounded-2xl border bg-background overflow-hidden transition-all hover:shadow-lg",
        !item.active && "opacity-60 grayscale-[20%]",
        !item.availability_status && "border-amber-300 bg-amber-50/30"
      )}
    >
      {/* Image Section */}
      <div className="relative h-40 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils size={48} className="text-primary/20" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {item.featured && (
            <span className="px-2 py-0.5 bg-gold text-primary text-[9px] font-extrabold rounded-full flex items-center gap-1">
              <Star size={10} fill="currentColor" /> Featured
            </span>
          )}
          {item.is_vegetarian && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-[9px] font-extrabold rounded-full">
              <Leaf size={10} className="inline mr-0.5" /> Veg
            </span>
          )}
          {item.spicy_level && item.spicy_level > 2 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded-full">
              {spicyLevels[item.spicy_level - 1]}
            </span>
          )}
        </div>
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full">
          <span className="text-white font-bold text-sm">
            PKR {Number(item.price).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm line-clamp-1">
              {item.name}
            </h3>
            {category && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground inline-block mt-1">
                {category.name}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Edit"
            >
              <Edit2 size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} className="text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        </div>

        {item.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} />
            {item.preparation_time_minutes} min
          </div>
          {!item.availability_status && (
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
              Unavailable
            </span>
          )}
          {!item.active && (
            <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Menu Item Form Modal ─────────────────────────────────────────────────────
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
    is_vegetarian: false,
    is_vegan: false,
    is_halal: true,
    spicy_level: 1,
    active: true,
  });

  const createItem = useCreateFoodItem();
  const updateItem = useUpdateFoodItem();
  const isEditing = !!editingItem;

  useEffect(() => {
    if (editingItem) {
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
        is_vegetarian: editingItem.is_vegetarian || false,
        is_vegan: editingItem.is_vegan || false,
        is_halal: editingItem.is_halal ?? true,
        spicy_level: editingItem.spicy_level || 1,
        active: editingItem.active !== false,
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
        is_vegetarian: false,
        is_vegan: false,
        is_halal: true,
        spicy_level: 1,
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
      is_vegetarian: formData.is_vegetarian,
      is_vegan: formData.is_vegan,
      is_halal: formData.is_halal,
      spicy_level: formData.spicy_level,
      active: formData.active,
    };

    try {
      if (isEditing && editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, payload });
        toast.success("Menu item updated successfully");
      } else {
        await createItem.mutateAsync(payload);
        toast.success("Menu item created successfully");
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
        className="relative z-10 w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <Utensils size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chicken Biryani"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={formData.preparation_time_minutes}
                  onChange={(e) => setFormData({ ...formData, preparation_time_minutes: parseInt(e.target.value) || 15 })}
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
              onChange={(e) => setFormData({ ...formData, ingredients_text: e.target.value })}
              placeholder="List main ingredients (e.g., Chicken, Rice, Spices, Yogurt)"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Dietary Options */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-foreground/70">
              Dietary & Preferences
            </label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_vegetarian}
                  onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-xs">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_vegan}
                  onChange={(e) => setFormData({ ...formData, is_vegan: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-xs">Vegan</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_halal}
                  onChange={(e) => setFormData({ ...formData, is_halal: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-xs">Halal</span>
              </label>
            </div>
          </div>

          {/* Spicy Level */}
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-2">
              Spicy Level: {formData.spicy_level}/5
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, spicy_level: level })}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    formData.spicy_level >= level
                      ? "bg-red-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  🌶️{level}
                </button>
              ))}
            </div>
          </div>

          {/* Status Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Available for ordering</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, availability_status: !formData.availability_status })}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors",
                  formData.availability_status ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
              >
                <span className={clsx(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  formData.availability_status ? "right-0.5" : "left-0.5"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Featured / Chef Special</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors",
                  formData.featured ? "bg-gold" : "bg-muted-foreground/30"
                )}
              >
                <span className={clsx(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  formData.featured ? "right-0.5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
              <span className="text-sm text-foreground">Item Active Status</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, active: !formData.active })}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors",
                  formData.active ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={clsx(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                  formData.active ? "right-0.5" : "left-0.5"
                )} />
              </button>
            </div>
          )}
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
            {(createItem.isPending || updateItem.isPending) ? (
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
          <h3 className="text-lg font-bold text-foreground mb-2">Delete Menu Item</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">"{itemName}"</span>?
            {isLoading ? "" : " This action cannot be undone."}
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
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
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
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FoodItem | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useKitchenCategories();
  const { data: items = [], isLoading: itemsLoading, refetch } = useKitchenMenu({
    category_id: selectedCategory || undefined,
    available: showOnlyAvailable ? true : undefined,
    active: true,
    q: searchQuery || undefined,
  });
  const deleteItem = useDeleteFoodItem();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(item.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem.mutateAsync(deletingItem.id);
      toast.success("Menu item deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to delete item");
    } finally {
      setDeletingItem(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    refetch();
  };

  // Get category name for filter button
  const activeCategory = categories.find((c) => c.id === selectedCategory);

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

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{items.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Items</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {items.filter((i) => i.availability_status).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gold">
              {items.filter((i) => i.featured).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Featured</p>
          </div>
          <div className="bg-muted/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">
              {categories.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => {
                const select = document.getElementById("category-select") as HTMLSelectElement;
                if (select) select.click();
              }}
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-sm flex items-center gap-2 hover:bg-muted transition-colors"
            >
              <Tag size={14} />
              {activeCategory ? activeCategory.name : "All Categories"}
              <ChevronDown size={12} />
            </button>
            <select
              id="category-select"
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Available Filter Toggle */}
          <button
            onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors",
              showOnlyAvailable
                ? "bg-emerald-500 text-white"
                : "border border-border bg-background hover:bg-muted"
            )}
          >
            <CheckCircle size={14} />
            Available Only
          </button>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory || showOnlyAvailable) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowOnlyAvailable(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>

        {/* Menu Items Grid */}
        {itemsLoading || categoriesLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary/40" />
            <p className="text-sm text-muted-foreground">Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <Utensils size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-foreground/70">No menu items found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchQuery ? "Try a different search term" : "Add your first menu item to get started"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onDelete={(id) => {
                  const itemToDelete = items.find((i) => i.id === id);
                  if (itemToDelete) setDeletingItem(itemToDelete);
                }}
                categories={categories}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {filteredItems.length > 0 && (
          <div className="flex justify-between items-center pt-4 text-xs text-muted-foreground border-t border-border">
            <span>Showing {filteredItems.length} of {items.length} items</span>
            <div className="flex gap-3">
              <span>⭐ {items.filter((i) => i.featured).length} featured</span>
              <span>🌱 {items.filter((i) => i.is_vegetarian).length} vegetarian</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <MenuItemFormModal
            isOpen={showForm}
            onClose={handleFormClose}
            editingItem={editingItem}
            categories={categories}
            onSuccess={refetch}
          />
        )}
        {deletingItem && (
          <DeleteConfirmModal
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