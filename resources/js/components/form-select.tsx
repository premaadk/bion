import React from "react";

type Opt = { value: string | number; label: string };
type Props = {
  label: string;
  name: string;
  value: string | number | undefined | null;
  onChange: (v: string) => void;
  options: Opt[];
  error?: string;
  placeholder?: string;
};
export default function FormSelect({ label, name, value, onChange, options, error, placeholder }: Props) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
      >
        <option value="">{placeholder ?? "— pilih —"}</option>
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
