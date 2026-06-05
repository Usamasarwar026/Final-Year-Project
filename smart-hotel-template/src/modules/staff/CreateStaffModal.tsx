// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { UserPlus, X, CheckCircle2, Loader2 } from "lucide-react";
// import clsx from "clsx";
// import { toast } from "sonner";
// import { useStaff } from "@/hooks/useStaff";
// import { useDepartments, useShifts } from "@/hooks/useStaff";
// import type { CreateStaffPayload, DepartmentConfig, ShiftConfig } from "@/types/staff";

// const STEPS = [
//   { n: 1, label: "Personal Info" },
//   { n: 2, label: "Job Details" },
//   { n: 3, label: "Permissions" },
// ];

// export default function CreateStaffModal({ onClose, onCreated }: {
//   onClose: () => void;
//   onCreated: () => void;
// }) {
//   const { createStaff } = useStaff();
//   const { departments } = useDepartments();
//   const { shifts } = useShifts();

//   const [step, setStep] = useState(1);
//   const [saving, setSaving] = useState(false);
//   const [creds, setCreds] = useState<any>(null);

//   // Form States
//   const [form, setForm] = useState({
//     name: "", email: "", phoneNumber: "", cnic: "", dateOfBirth: "",
//     address: "", city: "", country: "Pakistan",
//     department_id: 0,
//     designation: "",
//     shift_id: 0,
//     joining_date: new Date().toISOString().split("T")[0],
//     basic_salary: "",
//     permissions: [] as string[],
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const validate = () => {
//     const errs: Record<string, string> = {};
//     if (step === 1) {
//       if (!form.name.trim()) errs.name = "Required";
//       if (!form.email.trim()) errs.email = "Required";
//     }
//     if (step === 2) {
//       if (!form.department_id) errs.department = "Required";
//       if (!form.designation.trim()) errs.designation = "Required";
//       if (!form.shift_id) errs.shift = "Required";
//     }
//     setErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validate()) return;
//     setSaving(true);

//     const payload: CreateStaffPayload = {
//       ...form,
//       basic_salary: form.basic_salary ? parseFloat(form.basic_salary) : undefined,
//       permissions: form.permissions,
//     };

//     const res = await createStaff(payload);
//     setSaving(false);

//     if (res.ok && res.data) {
//       setCreds(res.data);
//     } else {
//       toast.error(res.error || "Failed to create staff");
//     }
//   };

//   if (creds) {
//     return (
//       <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70">
//         <motion.div className="bg-background rounded-2xl p-6 w-full max-w-md">
//           <div className="text-center">
//             <CheckCircle2 className="mx-auto text-green-500" size={48} />
//             <h3 className="text-xl font-semibold mt-4">Staff Created Successfully!</h3>
//             <div className="mt-6 space-y-2 text-left text-sm">
//               <p><strong>Name:</strong> {creds.staff.name}</p>
//               <p><strong>Email:</strong> {creds.staff.email}</p>
//               <p><strong>Employee ID:</strong> {creds.employeeId}</p>
//               <p><strong>Temp Password:</strong> <code className="bg-muted px-2 py-1 rounded">{creds.tempPassword}</code></p>
//             </div>
//             <button onClick={() => { onCreated(); onClose(); }} className="mt-6 w-full py-3 bg-primary text-white rounded-xl">
//               Done
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70">
//       <motion.div className="bg-background rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b">
//           <div className="flex items-center gap-3">
//             <UserPlus size={22} className="text-primary" />
//             <div>
//               <h2 className="font-semibold">Add New Staff Member</h2>
//               <p className="text-xs text-muted-foreground">Credentials will be sent via email</p>
//             </div>
//           </div>
//           <button onClick={onClose}><X size={20} /></button>
//         </div>

//         {/* Steps */}
//         <div className="px-5 pt-4 flex gap-2">
//           {STEPS.map((s) => (
//             <div key={s.n} className={clsx("flex-1 h-1 rounded-full", step >= s.n ? "bg-primary" : "bg-border")} />
//           ))}
//         </div>

//         <div className="flex-1 overflow-auto p-5">
//           {/* Step 1 */}
//           {step === 1 && (
//             <div className="grid grid-cols-2 gap-4">
//               <div className="col-span-2">
//                 <label className="text-sm">Full Name *</label>
//                 <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border" />
//                 {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
//               </div>
//               <div className="col-span-2">
//                 <label className="text-sm">Email Address *</label>
//                 <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border" />
//               </div>
//               {/* Other fields... (phone, cnic, dob, address etc.) */}
//             </div>
//           )}

//           {/* Step 2 - Job Details */}
//           {step === 2 && (
//             <div className="space-y-4">
//               <div>
//                 <label>Department *</label>
//                 <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: +e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border">
//                   <option value={0}>Select Department</option>
//                   {departments.map((d: DepartmentConfig) => (
//                     <option key={d.id} value={d.id}>{d.name}</option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label>Designation *</label>
//                 <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border" placeholder="Receptionist" />
//               </div>

//               <div>
//                 <label>Shift *</label>
//                 <select value={form.shift_id} onChange={(e) => setForm({ ...form, shift_id: +e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl border">
//                   <option value={0}>Select Shift</option>
//                   {shifts.map((s: ShiftConfig) => (
//                     <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//           )}

//           {/* Step 3 - Permissions (You can reuse PermissionPicker component) */}
//           {step === 3 && <div>Permission Picker coming soon...</div>}
//         </div>

//         <div className="p-5 border-t flex gap-3">
//           <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="flex-1 py-3 border rounded-xl">Back</button>
//           {step < 3 ? (
//             <button onClick={() => { if (validate()) setStep(s => s + 1); }} className="flex-1 py-3 bg-primary text-white rounded-xl">Next</button>
//           ) : (
//             <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl flex items-center justify-center gap-2">
//               {saving ? <Loader2 className="animate-spin" /> : "Create Staff"}
//             </button>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }