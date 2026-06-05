// src/types/profile.ts

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  designation: string | null;
  employeeId: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

export type UpdateProfilePayload = Partial<
  Pick<
    UserProfile,
    "name" | "phoneNumber" | "address" | "city" | "country" | "profileImage"
  >
>;