// "use client";

// import Link from "next/link";
// import { useSession } from "next-auth/react";

// export default function Sidebar() {
//   const { data: session } = useSession();

//   const role = session?.user?.role;

//   const menuItems = {
//     ADMIN: [
//       { name: "Dashboard", path: "/dashboard" },
//       { name: "Rooms", path: "/rooms" },
//       { name: "Bookings", path: "/bookings" },
//       { name: "Billing", path: "/billing" },
//       { name: "Staff", path: "/staff" },
//     ],

//     STAFF: [
//       { name: "Dashboard", path: "/dashboard" },
//       { name: "Rooms", path: "/rooms" },
//       { name: "Bookings", path: "/bookings" },
//     ],

//     CUSTOMER: [
//       { name: "Dashboard", path: "/dashboard" },
//       { name: "My Bookings", path: "/bookings" },
//       { name: "Profile", path: "/profile" },
//     ],
//   };

//   const links = menuItems[role as keyof typeof menuItems] || [];

//   return (
//     <aside className="w-64 h-screen border-r">
//       <div className="p-4 font-bold">Smart Hotel</div>

//       {links.map((item) => (
//         <Link
//           key={item.path}
//           href={item.path}
//           className="block p-3 hover:bg-gray-100"
//         >
//           {item.name}
//         </Link>
//       ))}
//     </aside>
//   );
// }
