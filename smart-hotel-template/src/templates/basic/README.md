
# Basic Hotel Template

This is the **Basic Template** for the Smart Hotel Management System, completely isolated from the **Advanced Template** (existing project files).

## Structure
```
src/templates/basic/
├── pages/
│   └── admin/
│       ├── customers.tsx    # Basic customer management
│       ├── rooms.tsx        # Basic rooms management
│       └── bookings.tsx     # Basic bookings management
├── components/              # (Empty for now - add reusable components later)
├── hooks/                   # (Empty for now - add custom hooks later)
├── services/                # (Empty for now - add custom services later)
├── types/                   # (Empty for now - add custom types later)
└── README.md                # This file
```

## Features
- ✅ Basic Customer Management (List, View, Add, Edit, Delete)
- ✅ Basic Rooms Management (List, View, Add, Edit, Delete)
- ✅ Basic Bookings Management (List, View, Add, Edit, Delete, Check-In/Check-Out)
- ✅ Notifications Integration (Reuses existing notification system)
- ✅ PKR Currency Display
- ✅ Uses existing Prisma Models
- ✅ Uses existing API Routes
- ✅ Uses existing Services & Hooks

## Important Rules
1. **NO MODIFICATIONS TO ADVANCED TEMPLATE FILES** - All Basic Template code is in this folder
2. Reuse existing APIs, services, hooks, and types
3. Do NOT duplicate Prisma models - reuse existing ones
4. Do NOT modify the existing Prisma schema unless absolutely necessary
5. Keep Basic Template simple, focused, and isolated

## How to Use (Later - Copy to Generation Folder)
1. Copy the entire `src/templates/basic/` folder to your generation directory
2. Integrate the pages into your app router (if needed)
3. Keep the Advanced Template untouched

## Reused Existing Assets
- **Prisma Models:** User, Room, Booking, Notification
- **API Routes:** /api/rooms, /api/bookings, /api/customers, /api/notifications
- **Services:** roomService, bookingService, notificationService
- **Hooks:** useNotifications, useCustomerModule, etc.
- **Components:** (You can reuse existing components like Topbar, Sidebar, Button, etc.)
- **Auth:** NextAuth, existing login/signup pages

