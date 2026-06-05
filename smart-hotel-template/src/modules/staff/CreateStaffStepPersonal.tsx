import { Users, Mail, Phone, CreditCard, MapPin, AlertCircle } from "lucide-react";
import clsx from "clsx";

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/15 transition-all";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}

      {error && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
}

type Props = {
  form: {
    name: string;
    email: string;
    phone: string;
    cnic: string;
    dob: string;
    city: string;
    address: string;
    country: string;
  };

  errors: Record<string, string>;

  updateField: (key: string, value: string) => void;
};

export default function CreateStaffStepPersonal({
  form,
  errors,
  updateField,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <Field label="Full Name" required error={errors.name}>
          <div className="relative">
            <Users
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={clsx(
                inputCls,
                "pl-8",
                errors.name && "border-red-400"
              )}
              placeholder="Muhammad Ali"
            />
          </div>
        </Field>
      </div>

      <div className="md:col-span-2">
        <Field label="Email Address" required error={errors.email}>
          <div className="relative">
            <Mail
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={clsx(
                inputCls,
                "pl-8",
                errors.email && "border-red-400"
              )}
              placeholder="staff@hotel.com"
            />
          </div>
        </Field>
      </div>

      <Field label="Phone Number">
        <div className="relative">
          <Phone
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className={clsx(inputCls, "pl-8")}
            placeholder="+92 300 0000000"
          />
        </div>
      </Field>

      <Field label="CNIC">
        <div className="relative">
          <CreditCard
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={form.cnic}
            onChange={(e) => updateField("cnic", e.target.value)}
            className={clsx(inputCls, "pl-8")}
            placeholder="35202-XXXXXXX-X"
          />
        </div>
      </Field>

      <Field label="Date of Birth">
        <input
          type="date"
          value={form.dob}
          onChange={(e) => updateField("dob", e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="City">
        <div className="relative">
          <MapPin
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            className={clsx(inputCls, "pl-8")}
            placeholder="Lahore"
          />
        </div>
      </Field>

      <div className="md:col-span-2">
        <Field label="Address">
          <input
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className={inputCls}
            placeholder="Street address"
          />
        </Field>
      </div>

      <Field label="Country">
        <input
          value={form.country}
          onChange={(e) => updateField("country", e.target.value)}
          className={inputCls}
        />
      </Field>
    </div>
  );
}