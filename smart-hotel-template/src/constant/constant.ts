
 const appName = process.env.NEXT_PUBLIC_APP_NAME;
 export const WebsiteName = appName

 // ... your existing constants

export const FOOTER_DATA = {
  brand: {
    name: "US Grand",
    tagline: "Luxury stays, fine dining, and unforgettable hospitality.",
  },
  
  exploreLinks: [
    { name: "Rooms", href: "#rooms" },
  ],
  
  contact: {
    phone: "+92 300 0000000",
    email: "info@usgrand.com",
  },
  
  copyright: "All rights reserved.",
};






export const IMAGES = {
  heroImage: "/assets/hero-hotel.jpg",
  deluxeImg: "/assets/room-deluxe.jpg",
  suiteImg: "/assets/room-suite.jpg",
  standardImg: "/assets/room-standard.jpg"
};


// lib/rooms/constants.ts



export const ROOM_TYPES = [
  "Single",
  "Double",
  "Suite",
  "Deluxe",
  "Presidential",
] as const;

export const ROOM_STATUSES = [
  "Available",
  "Reserved",
  "Occupied",
  "Maintenance",
] as const;

export const BED_TYPES = [
  "Single",
  "Double",
  "Queen",
  "King",
  "Twin",
] as const;

export const AMENITIES_LIST = [
  "WiFi",
  "AC",
  "TV",
  "Smart TV",
  "Mini Fridge",
  "Mini Bar",
  "Coffee Maker",
  "Jacuzzi",
  "Wardrobe",
  "Room Service",
  "Butler",
  "Lounge",
  "Private Pool",
  "Gym Access",
  "Dining Area",
  "Safe",
  "Balcony",
  "Sea View",
  "City View",
  "Garden View",
] as const;

export type RoomType     = (typeof ROOM_TYPES)[number];
export type RoomStatus   = (typeof ROOM_STATUSES)[number];
export type BedType      = (typeof BED_TYPES)[number];

export interface Room {
  room_id?:         number;
  room_number:      string;
  floor:            number;
  room_type:        RoomType;
  status:           RoomStatus;
  price_per_night:  number;
  capacity:         number;
  bed_type:         BedType;
  size_sqft?:       number | null;
  amenities?:       string[];
  photos?:          string[];
  description?:     string;
  is_active:        boolean;
  created_at?:      string;
  updated_at?:      string;
}

export const STATUS_CONFIG: Record<
  RoomStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  Available:   { label: "Available",   bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500"  },
  Reserved:    { label: "Reserved",    bg: "bg-blue-500/10",    text: "text-blue-500",    dot: "bg-blue-500"     },
  Occupied:    { label: "Occupied",    bg: "bg-amber-500/10",   text: "text-amber-500",   dot: "bg-amber-500"    },
  Maintenance: { label: "Maintenance", bg: "bg-red-500/10",     text: "text-red-500",     dot: "bg-red-500"      },
};

export const TYPE_CONFIG: Record<RoomType, { icon: string; color: string }> = {
  Single:       { icon: "🛏️",  color: "text-slate-400"   },
  Double:       { icon: "🛏️🛏️", color: "text-blue-400"   },
  Suite:        { icon: "✨",  color: "text-purple-400"  },
  Deluxe:       { icon: "⭐",  color: "text-amber-400"   },
  Presidential: { icon: "👑",  color: "text-gold"        },
};

