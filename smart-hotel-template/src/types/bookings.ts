// // src/constant/booking.ts  (ya src/types/booking.ts)

// export type BookingStatus =
//   | "Pending"
//   | "Confirmed"
//   | "CheckedIn"
//   | "CheckedOut"
//   | "Cancelled";

// export type Booking = {
//   booking_id: number;
//   user_id: string;
//   room_id: number;
//   check_in_date: string; // ISO date string
//   check_out_date: string;
//   actual_check_in: string | null;
//   actual_check_out: string | null;
//   status: BookingStatus;
//   total_nights: number;
//   total_amount: number;
//   special_requests: string | null;
//   confirmation_sent: boolean;
//   created_at: string;
//   updated_at: string;
//   // Joined fields from relations
//   user?: {
//     id: string;
//     name: string;
//     email: string;
//     phoneNumber: string | null;
//   };
//   room?: {
//     room_id: number;
//     room_number: string;
//     room_type: string;
//     floor: number;
//     bed_type: string;
//     price_per_night: number;
//     photos: string[];
//     capacity: number;
//   };
// };

// export type CreateBookingPayload = {
//   room_id: number;
//   check_in_date: string;
//   check_out_date: string;
//   special_requests?: string;
// };

// export type UpdateBookingPayload = Partial<{
//   status: BookingStatus;
//   actual_check_in: string;
//   actual_check_out: string;
//   special_requests: string;
// }>;

// // ── UI config ──
// export const BOOKING_STATUS_CONFIG: Record<
//   BookingStatus,
//   {
//     label: string;
//     bg: string;
//     text: string;
//     dot: string;
//   }
// > = {
//   Pending: {
//     label: "Pending",
//     bg: "bg-yellow-100 dark:bg-yellow-900",
//     text: "text-white",
//     dot: "bg-yellow-500",
//   },

//   Confirmed: {
//     label: "Confirmed",
//     bg: "bg-sky-100 dark:bg-sky-900",
//     text: "text-white",
//     dot: "bg-sky-500",
//   },

//   CheckedIn: {
//     label: "Checked In",
//     bg: "bg-emerald-100 dark:bg-emerald-900",
//     text: "text-white",
//     dot: "bg-emerald-500",
//   },

//   CheckedOut: {
//     label: "Checked Out",
//     bg: "bg-violet-100 dark:bg-violet-900",
//     text: "text-white",
//     dot: "bg-violet-500",
//   },

//   Cancelled: {
//     label: "Cancelled",
//     bg: "bg-rose-100 dark:bg-rose-900",
//     text: "text-white",
//     dot: "bg-rose-500",
//   },
// };

// export const ALL_BOOKING_STATUSES: BookingStatus[] = [
//   "Pending",
//   "Confirmed",
//   "CheckedIn",
//   "CheckedOut",
//   "Cancelled",
// ];

// // Next valid status transitions — what admin can do
// export const STATUS_ACTIONS: Partial<
//   Record<
//     BookingStatus,
//     {
//       label: string;
//       next: BookingStatus;
//       color: string;
//     }[]
//   >
// > = {
//   Pending: [
//     { label: "Confirm", next: "Confirmed", color: "bg-blue-500 text-white" },
//     { label: "Cancel", next: "Cancelled", color: "bg-red-500  text-white" },
//   ],
//   Confirmed: [
//     { label: "Check In", next: "CheckedIn", color: "bg-green-500 text-white" },
//     { label: "Cancel", next: "Cancelled", color: "bg-red-500   text-white" },
//   ],
//   CheckedIn: [
//     {
//       label: "Check Out",
//       next: "CheckedOut",
//       color: "bg-slate-600 text-white",
//     },
//   ],
// };




// src/types/bookings.ts

export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "CheckedIn"
  | "CheckedOut"
  | "Cancelled";

export type BookingSource = "CUSTOMER" | "ADMIN";

export const ALL_BOOKING_STATUSES: BookingStatus[] = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "CheckedOut",
  "Cancelled",
];

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  Pending: {
    label:  "Pending",
    bg:     "bg-amber-50",
    text:   "text-amber-700",
    dot:    "bg-amber-400",
    border: "border-amber-200",
  },
  Confirmed: {
    label:  "Confirmed",
    bg:     "bg-blue-50",
    text:   "text-blue-700",
    dot:    "bg-blue-500",
    border: "border-blue-200",
  },
  CheckedIn: {
    label:  "Checked In",
    bg:     "bg-green-50",
    text:   "text-green-700",
    dot:    "bg-green-500",
    border: "border-green-200",
  },
  CheckedOut: {
    label:  "Checked Out",
    bg:     "bg-gray-50",
    text:   "text-gray-600",
    dot:    "bg-gray-400",
    border: "border-gray-200",
  },
  Cancelled: {
    label:  "Cancelled",
    bg:     "bg-red-50",
    text:   "text-red-700",
    dot:    "bg-red-500",
    border: "border-red-200",
  },
};

export const STATUS_ACTIONS: Record<
  BookingStatus,
  { label: string; next: BookingStatus; color: string }[]
> = {
  Pending:    [
    { label: "Confirm",   next: "Confirmed",  color: "bg-blue-600 text-white hover:bg-blue-700"   },
    { label: "Cancel",    next: "Cancelled",  color: "bg-red-500 text-white hover:bg-red-600"     },
  ],
  Confirmed:  [
    { label: "Check In",  next: "CheckedIn",  color: "bg-green-600 text-white hover:bg-green-700" },
    { label: "Cancel",    next: "Cancelled",  color: "bg-red-500 text-white hover:bg-red-600"     },
  ],
  CheckedIn:  [
    { label: "Check Out", next: "CheckedOut", color: "bg-purple-600 text-white hover:bg-purple-700" },
  ],
  CheckedOut: [],
  Cancelled:  [],
};

// ─── Room ──────────────────────────────────────────────────────────────────
export type RoomType    = "Single" | "Double" | "Suite" | "Deluxe" | "Presidential";
export type RoomStatus  = "Available" | "Reserved" | "Occupied" | "Maintenance";
export type BedType     = "Single" | "Double" | "Queen" | "King" | "Twin";

export interface Room {
  room_id:        number;
  room_number:    string;
  floor:          number;
  room_type:      RoomType;
  status:         RoomStatus;
  price_per_night: number;
  capacity:       number;
  bed_type:       BedType;
  size_sqft?:     number;
  amenities?:     string[] | null;
  photos?:        string[] | null;
  description?:   string | null;
  is_active:      boolean;
}

// ─── User / Customer ───────────────────────────────────────────────────────
export interface CustomerUser {
  id:           string;
  name:         string;
  email:        string;
  phoneNumber?: string | null;
  profileImage?: string | null;
  cnic?:        string | null;
  city?:        string | null;
  country?:     string | null;
  isActive:     boolean;
  createdAt:    string;
  bookings?:    { booking_id: number }[];
}

// ─── Booking ───────────────────────────────────────────────────────────────
export interface Booking {
  booking_id:       number;
  user_id:          string;
  room_id:          number;
  check_in_date:    string;
  check_out_date:   string;
  actual_check_in?: string | null;
  actual_check_out?: string | null;
  status:           BookingStatus;
  total_nights:     number;
  total_amount:     number;
  special_requests?: string | null;
  confirmation_sent: boolean;
  source:           BookingSource;
  created_at:       string;
  updated_at:       string;
  user?: {
    id:    string;
    name:  string;
    email: string;
    phoneNumber?: string | null;
  };
  room?: Room & {
    amenities?: string[] | null;
    photos?:    string[] | null;
  };
}

export interface CreateBookingPayload {
  room_id:          number;
  check_in_date:    string;
  check_out_date:   string;
  special_requests?: string;
  // admin-only
  user_id?:         string;
  source?:          BookingSource;
}

export interface CreateCustomerPayload {
  name:         string;
  email:        string;
  phoneNumber?: string;
  cnic?:        string;
  city?:        string;
  country?:     string;
  password?:    string; // if not provided, auto-generate
}

export interface UpdateBookingPayload {
  status?:           BookingStatus;
  actual_check_in?:  string | null;
  actual_check_out?: string | null;
  special_requests?: string | null;
  room_id?:          number;
  check_in_date?:    string;
  check_out_date?:   string;
}