// "use client";

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   type ReactNode,
// } from "react";

// interface DummyUser {
//   id: string;
//   email: string;
//   user_metadata?: {
//     full_name?: string;
//   };
// }

// interface AuthContextType {
//   user: DummyUser | null;
//   session: any;
//   loading: boolean;
//   signUp: (
//     email: string,
//     password: string,
//     fullName: string,
//   ) => Promise<{ error: any }>;
//   signIn: (email: string, password: string) => Promise<{ error: any }>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<DummyUser | null>(null);
//   const [session, setSession] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   // Load saved user from localStorage
//   useEffect(() => {
//     const savedUser = localStorage.getItem("dummy-user");

//     if (savedUser) {
//       const parsedUser = JSON.parse(savedUser);

//       setUser(parsedUser);
//       setSession({ user: parsedUser });
//     }

//     setLoading(false);
//   }, []);

//   // Dummy Sign Up
//   const signUp = async (email: string, password: string, fullName: string) => {
//     try {
//       const newUser: DummyUser = {
//         id: crypto.randomUUID(),
//         email,
//         user_metadata: {
//           full_name: fullName,
//         },
//       };

//       localStorage.setItem("dummy-user", JSON.stringify(newUser));

//       setUser(newUser);
//       setSession({ user: newUser });

//       return { error: null };
//     } catch (error) {
//       return { error };
//     }
//   };

//   // Dummy Sign In
//   const signIn = async (email: string, password: string) => {
//     try {
//       const existingUser = localStorage.getItem("dummy-user");

//       if (!existingUser) {
//         return {
//           error: {
//             message: "No user found. Please sign up first.",
//           },
//         };
//       }

//       const parsedUser = JSON.parse(existingUser);

//       if (parsedUser.email !== email) {
//         return {
//           error: {
//             message: "Invalid email.",
//           },
//         };
//       }

//       setUser(parsedUser);
//       setSession({ user: parsedUser });

//       return { error: null };
//     } catch (error) {
//       return { error };
//     }
//   };

//   // Dummy Sign Out
//   const signOut = async () => {
//     localStorage.removeItem("dummy-user");

//     setUser(null);
//     setSession(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         session,
//         loading,
//         signUp,
//         signIn,
//         signOut,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }

//   return context;
// };
