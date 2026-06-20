// src/types/profile.type.ts

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  address: string | null;
  cnic: string | null;
  dateOfBirth: string | null; // ISO string from API
  city: string | null;
  country: string | null;
  role: "ADMIN"; // schema mein sirf ADMIN enum hai abhi
  isVerified: boolean;
  isActive: boolean;
  createdAt: string; // ISO string from API
};

export type UpdateProfilePayload = Partial<
  Pick<
    UserProfile,
    | "name"
    | "phoneNumber"
    | "address"
    | "city"
    | "country"
    | "profileImage"
    | "cnic"
    | "dateOfBirth"
  >
>;
