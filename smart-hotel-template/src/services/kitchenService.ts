import api from "@/lib/axios";
import type {
  FoodCategory,
  FoodItem,
  FoodOrder,
  KitchenTask,
  KitchenStats,
  CreateCategoryPayload,
  CreateFoodItemPayload,
  PlaceOrderPayload,
} from "@/types/kitchen";
export const kitchenService = {
  // Categories
  getCategories: async () => {
    const { data } = await api.get<{ categories: FoodCategory[] }>("/kitchen/categories");
    return data.categories;
  },
  createCategory: async (payload: CreateCategoryPayload) => {
    const { data } = await api.post<{ category: FoodCategory }>("/kitchen/categories", payload);
    return data.category;
  },
  updateCategory: async (id: number, payload: Partial<CreateCategoryPayload>) => {
    const { data } = await api.patch<{ category: FoodCategory }>(`/kitchen/categories/${id}`, payload);
    return data.category;
  },
  deleteCategory: async (id: number) => {
    const { data } = await api.delete<{ success: boolean }>(`/kitchen/categories/${id}`);
    return data;
  },
  // Menu Items
  getMenu: async (filters?: { category_id?: number; available?: boolean; active?: boolean; featured?: boolean; q?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.category_id) params.set("category_id", String(filters.category_id));
      if (filters.available !== undefined) params.set("available", String(filters.available));
      if (filters.active !== undefined) params.set("active", String(filters.active));
      if (filters.featured !== undefined) params.set("featured", String(filters.featured));
      if (filters.q) params.set("q", filters.q);
    }
    const { data } = await api.get<{ items: FoodItem[] }>(`/kitchen/menu?${params.toString()}`);
    return data.items;
  },
  createFoodItem: async (payload: CreateFoodItemPayload) => {
    const { data } = await api.post<{ item: FoodItem }>("/kitchen/menu", payload);
    return data.item;
  },
  updateFoodItem: async (id: number, payload: Partial<CreateFoodItemPayload>) => {
    const { data } = await api.patch<{ item: FoodItem }>(`/kitchen/menu/${id}`, payload);
    return data.item;
  },
  deleteFoodItem: async (id: number) => {
    const { data } = await api.delete<{ success: boolean }>(`/kitchen/menu/${id}`);
    return data;
  },


  // Orders
  getOrders: async (filters?: { status?: string; order_type?: string; q?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status) params.set("status", filters.status);
      if (filters.order_type) params.set("order_type", filters.order_type);
      if (filters.q) params.set("q", filters.q);
    }
    const { data } = await api.get<{ orders: FoodOrder[] }>(`/kitchen/orders?${params.toString()}`);
    return data.orders;
  },
  placeOrder: async (payload: PlaceOrderPayload) => {
    const { data } = await api.post<{ order: FoodOrder }>("/kitchen/orders", payload);
    return data.order;
  },
  updateOrderStatus: async (id: number, payload: { status?: string; assigned_to?: number; notes?: string }) => {
    const { data } = await api.patch<{ order: FoodOrder }>(`/kitchen/orders/${id}`, payload);
    return data.order;
  },
  // Tasks (Staff Specific)
  getTasks: async (filters?: { status?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    const { data } = await api.get<{ tasks: KitchenTask[] }>(`/kitchen/tasks?${params.toString()}`);
    return data.tasks;
  },
  updateTaskStatus: async (id: number, status: string) => {
    const { data } = await api.patch<{ task: KitchenTask }>(`/kitchen/tasks/${id}`, { status });
    return data.task;
  },
  // Stats (Admin/Staff Specific)
  getStats: async () => {
    const { data } = await api.get<{ stats: KitchenStats }>("/kitchen/stats");
    return data.stats;
  },


  // Add to src/services/kitchenService.ts

// Add these functions to the existing kitchenService object

// Staff Management
getKitchenStaff: async (filters?: { role?: string; active?: boolean }) => {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.active !== undefined) params.set("active", String(filters.active));
  const { data } = await api.get<{ staff: KitchenStaff[] }>(`/kitchen/staff?${params.toString()}`);
  return data.staff;
},

getDeliveryStaff: async () => {
  const { data } = await api.get<{ staff: DeliveryStaff[] }>("/staff/delivery");
  return data.staff;
},

createKitchenStaff: async (payload: { userId: string; designation: string; department: string }) => {
  const { data } = await api.post("/staff", payload);
  return data.staff;
},

updateKitchenStaff: async (id: number, payload: { designation?: string; is_active?: boolean; is_on_duty?: boolean }) => {
  const { data } = await api.patch(`/staff/${id}`, payload);
  return data.staff;
},

// Delivery Stats
getDeliveryStats: async () => {
  const { data } = await api.get<{ stats: any }>("/kitchen/delivery-stats");
  return data.stats;
},



};



