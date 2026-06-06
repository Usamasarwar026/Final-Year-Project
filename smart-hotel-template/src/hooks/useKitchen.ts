import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kitchenService } from "@/services/kitchenService";
import { toast } from "sonner";
import type {
  CreateCategoryPayload,
  CreateFoodItemPayload,
  PlaceOrderPayload,
} from "@/types/kitchen";
// Query Keys
export const KITCHEN_KEYS = {
  categories: ["kitchen", "categories"] as const,
  menu: (filters?: any) => ["kitchen", "menu", filters] as const,
  orders: (filters?: any) => ["kitchen", "orders", filters] as const,
  tasks: (filters?: any) => ["kitchen", "tasks", filters] as const,
  stats: ["kitchen", "stats"] as const,
  kitchenStaff: ["kitchen", "staff"] as const,
  deliveryStaff: ["delivery", "staff"] as const,
  deliveryStats: ["delivery", "stats"] as const,
};
// ─── Queries ──────────────────────────────────────────────────────────────────
export function useKitchenCategories() {
  return useQuery({
    queryKey: KITCHEN_KEYS.categories,
    queryFn: kitchenService.getCategories,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
export function useKitchenMenu(filters?: {
  category_id?: number;
  available?: boolean;
  active?: boolean;
  featured?: boolean;
  q?: string;
}) {
  return useQuery({
    queryKey: KITCHEN_KEYS.menu(filters),
    queryFn: () => kitchenService.getMenu(filters),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
export function useKitchenOrders(filters?: {
  status?: string;
  order_type?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: KITCHEN_KEYS.orders(filters),
    queryFn: () => kitchenService.getOrders(filters),
    refetchInterval: 10 * 1000, // Poll orders every 10s for live KDS updates
  });
}
export function useKitchenTasks(filters?: { status?: string }) {
  return useQuery({
    queryKey: KITCHEN_KEYS.tasks(filters),
    queryFn: () => kitchenService.getTasks(filters),
    refetchInterval: 10 * 1000, // Poll tasks every 10s for live updates
  });
}
export function useKitchenStats() {
  return useQuery({
    queryKey: KITCHEN_KEYS.stats,
    queryFn: kitchenService.getStats,
    staleTime: 30 * 1000, // 30s
  });
}
// ─── Mutations ────────────────────────────────────────────────────────────────
// Categories
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.categories });
      toast.success("Category created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to create category");
    },
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateCategoryPayload>;
    }) => kitchenService.updateCategory(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.categories });
      toast.success("Category updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update category");
    },
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.categories });
      toast.success("Category deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to delete category");
    },
  });
}
// Food Items
export function useCreateFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.createFoodItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen", "menu"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      toast.success("Food item created successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to create food item");
    },
  });
}
export function useUpdateFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      kitchenService.updateFoodItem(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen", "menu"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      toast.success("Food item updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update food item");
    },
  });
}
export function useDeleteFoodItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.deleteFoodItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen", "menu"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      toast.success("Food item deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to delete food item");
    },
  });
}
// Orders
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.placeOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen", "orders"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      toast.success("Order placed successfully! 🍕");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to place order");
    },
  });
}
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { status?: string; assigned_to?: number; notes?: string };
    }) => kitchenService.updateOrderStatus(id, payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["kitchen", "orders"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      qc.invalidateQueries({ queryKey: ["kitchen", "tasks"] });

      if (variables.payload.assigned_to) {
        toast.success("Delivery staff assigned successfully");
      } else {
        toast.success(`Order status updated to ${variables.payload.status}`);
      }
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.error || "Failed to update order status",
      );
    },
  });
}
// Tasks
export function useUpdateKitchenTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      kitchenService.updateTaskStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kitchen", "tasks"] });
      qc.invalidateQueries({ queryKey: ["kitchen", "orders"] });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.stats });
      toast.success("Task status updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update task");
    },
  });
}

// Add to src/hooks/useKitchen.ts

// Add these exports to the existing file

// Staff Queries

export function useKitchenStaff(filters?: { role?: string; active?: boolean }) {
  return useQuery({
    queryKey: [...KITCHEN_KEYS.kitchenStaff, filters],
    queryFn: () => kitchenService.getKitchenStaff(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useDeliveryStaff() {
  return useQuery({
    queryKey: KITCHEN_KEYS.deliveryStaff,
    queryFn: kitchenService.getDeliveryStaff,
    staleTime: 1 * 60 * 1000,
  });
}

export function useDeliveryStats() {
  return useQuery({
    queryKey: KITCHEN_KEYS.deliveryStats,
    queryFn: kitchenService.getDeliveryStats,
    staleTime: 30 * 1000,
  });
}

// Add mutations for staff
export function useCreateKitchenStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kitchenService.createKitchenStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.kitchenStaff });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.deliveryStaff });
      toast.success("Staff added successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to add staff");
    },
  });
}

export function useUpdateKitchenStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      kitchenService.updateKitchenStaff(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.kitchenStaff });
      qc.invalidateQueries({ queryKey: KITCHEN_KEYS.deliveryStaff });
      toast.success("Staff updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to update staff");
    },
  });
}
