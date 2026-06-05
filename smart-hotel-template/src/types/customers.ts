// src/types/customers.ts

export interface Customer {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  cnic: string | null;
  dateOfBirth: string | null;
  createdByAdmin: boolean;
  isVerified: boolean;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
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
  email?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  cnic?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  isVerified?: boolean;
}