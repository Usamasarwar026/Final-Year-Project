// src/types/customers.ts
export type Gender = "Male" | "Female" | "Other";

export interface Customer {
  customer_id: number;
  name: string;
  email?: string | null;
  phone_number: string;
  cnic?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  city?: string | null;
  country?: string | null;
  emergency_contact?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  bookings?: {
    booking_id: number;
  }[];
}

export interface CustomerStats {
  totalBookings: number;
  completedStays: number;
  cancelledBookings: number;
  totalSpent: number;
  activeBookings: number;
  avgNightsPerStay: number;
}

export interface CustomerBooking {
  booking_id: number;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_nights: number;
  total_amount: number;
  source: string;
  created_at: string;
  room: {
    room_number: string;
    room_type: string;
    floor: number;
    bed_type: string;
    photos: string[];
  } | null;
}

export interface CustomerProfile extends Customer {
  stats: CustomerStats;
  recentBookings: CustomerBooking[];
}

export interface UpdateCustomerPayload {
  name?: string;
  email?: string | null;
  phone_number?: string;
  cnic?: string | null;
  gender?: Gender | null;
  date_of_birth?: string | null;
  city?: string | null;
  country?: string | null;
  emergency_contact?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
